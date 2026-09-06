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

/**
 * Grounded googleSearch calls cannot use JSON mode, so free text is the only
 * channel and the model sometimes wraps the array in a sentence despite being
 * told not to. A stray "Here are the grants I found:" must not throw away a
 * search that just spent two minutes and 30 real Google queries, so fall back
 * to slicing out the outermost array before giving up.
 */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("No JSON array found in model output");
  }
}
