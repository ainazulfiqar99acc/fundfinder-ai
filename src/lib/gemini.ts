import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env.local");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Override via .env.local if your account has access to different model IDs.
export const SEARCH_MODEL = process.env.GEMINI_SEARCH_MODEL || "gemini-2.5-flash";
export const DRAFT_MODEL = process.env.GEMINI_DRAFT_MODEL || "gemini-2.5-flash";

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}
