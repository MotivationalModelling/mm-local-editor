export async function generateUserStories(prompt: string): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/user-stories`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({prompt}),
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("OpenAI API endpoint unavailable. Run npm run dev or npm run preview locally.");
  }
  const result = await response.json() as {text?: string; error?: string};
  if (!response.ok) {
    throw new Error(result.error || `OpenAI API request failed (${response.status})`);
  }
  if (typeof result.text !== "string" || !result.text.trim()) {
    throw new Error("API error: response missing content");
  }
  return result.text;
}
