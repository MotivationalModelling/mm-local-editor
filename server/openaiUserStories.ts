import OpenAI from "openai";
import type {Connect, Plugin} from "vite";

export async function generateStoryText(apiKey: string, prompt: string): Promise<string> {
  const client = new OpenAI({apiKey, maxRetries: 0});
  const stream = await client.responses.create({
    model: "gpt-6-astra",
    service_tier: "default",
    input: [{role: "user", content: prompt}],
    text: {format: {type: "text"}, verbosity: "medium"},
    reasoning: {effort: "medium", mode: "standard", summary: "auto"},
    tools: [],
    stream: true,
    store: true,
    include: ["reasoning.encrypted_content", "web_search_call.action.sources"],
  });

  let text = "";
  let completed = false;
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      text += event.delta;
    } else if (event.type === "response.refusal.delta") {
      throw new Error("OpenAI declined to generate these user stories.");
    } else if (event.type === "response.failed") {
      throw new Error(event.response.error?.message ?? "Response generation failed");
    } else if (event.type === "response.incomplete") {
      throw new Error(`Response generation incomplete: ${event.response.incomplete_details?.reason ?? "unknown reason"}`);
    } else if (event.type === "error") {
      throw new Error(event.message);
    } else if (event.type === "response.completed") {
      completed = true;
    }
  }
  if (!completed) throw new Error("OpenAI response stream ended before completion");
  if (!text.trim()) throw new Error("API error: response missing content");
  return text;
}

export function openaiUserStories(apiKey: string | undefined): Plugin {
  let endpoint: string;
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (req.url?.split("?")[0] !== endpoint) return next();
    const send = (status: number, result: {text?: string; error?: string}) => {
      res.writeHead(status, {"Content-Type": "application/json", "Cache-Control": "no-store"});
      res.end(JSON.stringify(result));
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return send(405, {error: "Method not allowed"});
    }
    if (!apiKey?.trim()) return send(503, {error: "OPENAI_API_KEY is not set in .env. Set it and restart Vite."});

    let prompt: unknown;
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 1024 * 1024) return send(413, {error: "Prompt is too large"});
      }
      prompt = JSON.parse(body).prompt;
    } catch {
      return send(400, {error: "Invalid JSON request"});
    }
    if (typeof prompt !== "string" || !prompt.trim()) return send(400, {error: "Prompt must be a non-empty string"});

    try {
      send(200, {text: await generateStoryText(apiKey, prompt)});
    } catch (error) {
      const status = error instanceof OpenAI.APIError ? error.status ?? 502 : 502;
      const message = error instanceof Error ? error.message : "OpenAI request failed";
      send(status, {error: message.split(apiKey).join("[redacted]")});
    }
  };
  return {
    name: "openai-user-stories",
    configResolved(config) {
      endpoint = `${config.base}api/user-stories`;
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
