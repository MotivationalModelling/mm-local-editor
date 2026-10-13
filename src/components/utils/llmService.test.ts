import {afterEach, describe, expect, it, vi} from "vitest";
import {generateUserStories} from "./llmService";

afterEach(() => vi.unstubAllGlobals());

describe("user story API client", () => {
  it("passes the prompt to the local endpoint and returns completed text", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({text: '{"stories":[]}'}));
    vi.stubGlobal("fetch", fetch);
    expect(await generateUserStories("model prompt")).toBe('{"stories":[]}');
    expect(fetch).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}api/user-stories`, {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: "model prompt"}),
    });
  });

  it("shows server API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({error: "Rate limit"}, {status: 429})));
    await expect(generateUserStories("prompt")).rejects.toThrow("Rate limit");
  });

  it("explains a missing backend on static hosting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html></html>", {
      headers: {"Content-Type": "text/html"},
    })));
    await expect(generateUserStories("prompt")).rejects.toThrow("endpoint unavailable");
  });

  it("rejects empty output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({text: " "})));
    await expect(generateUserStories("prompt")).rejects.toThrow("missing content");
  });
});
