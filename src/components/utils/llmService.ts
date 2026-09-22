import {GoogleGenAI} from "@google/genai";

export async function generateUserStories(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("VITE_GOOGLE_API_KEY is not set in .env");
  }

  const client = new GoogleGenAI({apiKey});
  const response = await client.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      // SDK 2.22 does not yet expose store in GenerateContentConfig.
      httpOptions: {
        extraBody: {store: true},
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("API error: response missing content");
  }
  return text;
}
