import {beforeEach, describe, expect, it, vi} from "vitest";
import {generateStoryText} from "./openaiUserStories";

const {create, constructor} = vi.hoisted(() => ({create: vi.fn(), constructor: vi.fn()}));
vi.mock("openai", () => ({
  default: class {
    constructor(options: unknown) { constructor(options); }
    responses = {create};
  },
}));

function stream(events: unknown[]) {
  create.mockResolvedValueOnce((async function* () {
    for (const event of events) yield event;
  })());
}

beforeEach(() => vi.resetAllMocks());

describe("OpenAI story generation", () => {
  it("sends the prompt with the requested settings and collects only output text", async () => {
    stream([
      {type: "response.reasoning_summary_text.delta", delta: "reasoning"},
      {type: "response.output_text.delta", delta: '{"stories":'},
      {type: "response.output_text.delta", delta: "[]}"},
      {type: "response.completed"},
    ]);
    expect(await generateStoryText("test-key", "Model prompt")).toBe('{"stories":[]}');
    expect(constructor).toHaveBeenCalledWith({apiKey: "test-key", maxRetries: 0});
    expect(create).toHaveBeenCalledWith({
      model: "gpt-6-astra",
      service_tier: "default",
      input: [{role: "user", content: "Model prompt"}],
      text: {format: {type: "text"}, verbosity: "medium"},
      reasoning: {effort: "medium", mode: "standard", summary: "auto"},
      tools: [], stream: true, store: true,
      include: ["reasoning.encrypted_content", "web_search_call.action.sources"],
    });
  });

  it.each([
    [{type: "response.failed", response: {error: {message: "Generation failed"}}}, "Generation failed"],
    [{type: "response.incomplete", response: {incomplete_details: {reason: "max_output_tokens"}}}, "max_output_tokens"],
    [{type: "error", message: "Rate limit"}, "Rate limit"],
    [{type: "response.refusal.delta", delta: "Cannot comply"}, "declined"],
  ])("rejects failed or refused streams instead of returning partial stories", async (event, message) => {
    stream([{type: "response.output_text.delta", delta: "partial"}, event]);
    await expect(generateStoryText("test-key", "prompt")).rejects.toThrow(message as string);
  });

  it("rejects a disconnected stream", async () => {
    stream([{type: "response.output_text.delta", delta: "partial"}]);
    await expect(generateStoryText("test-key", "prompt")).rejects.toThrow("before completion");
  });

  it("rejects an empty completed response", async () => {
    stream([{type: "response.completed"}]);
    await expect(generateStoryText("test-key", "prompt")).rejects.toThrow("missing content");
  });

  it("propagates connection failures without retrying", async () => {
    create.mockRejectedValueOnce(new Error("Connection failed"));
    await expect(generateStoryText("test-key", "prompt")).rejects.toThrow("Connection failed");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
