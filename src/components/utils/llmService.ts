export async function generateUserStories(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("VITE_GOOGLE_API_KEY is not set in .env");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{role: "user", parts: [{text: prompt}]}],
    }),
    }
  );

  if (!response.ok) {
    let message = "";
    try {
      const errData = (await response.json()) as {error?: {message?: string}};
      message = errData.error?.message ?? "";
    } catch {
      message = "";
    }
    throw new Error(`Gemini API error: ${response.status}${message ? ` - ${message}` : ""}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{text?: string}>;
      };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("API error: response missing content");
  }
  return text;
}
