/**
 * Which Gemini models actually honour the googleSearch tool?
 *
 * Run:  npm run check-grounding
 *
 * The premise of this app is that grant matches come from live search rather
 * than model memory. That premise is only true if the model actually runs the
 * tool — and a model that ignores it does not say so. It returns a fluent,
 * entirely plausible answer with no groundingMetadata attached.
 *
 * This script sends one identical grounded prompt to each model and reports
 * whether grounding actually happened. It needs only GEMINI_API_KEY; it does
 * not touch the app, the server, or any of its code paths.
 *
 * Exits non-zero if the model this app is configured to use is not grounded.
 */
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "node:fs";

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    return readFileSync(".env.local", "utf8")
      .match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]
      ?.trim();
  } catch {
    return undefined;
  }
}

const apiKey = env("GEMINI_API_KEY");
if (!apiKey) {
  console.error("GEMINI_API_KEY not set (env or .env.local). Cannot run.");
  process.exit(2);
}

const CONFIGURED = env("GEMINI_SEARCH_MODEL") || "gemini-2.5-flash";

// CONFIGURED goes first so the model this app actually uses is always probed.
// Without it, a custom GEMINI_SEARCH_MODEL is never tested and the script exits
// non-zero for a model it simply never tried — which reads as the grounding
// claim failing. Keep the default here in sync with SEARCH_MODEL in
// src/lib/gemini.ts.
const MODELS = [
  ...new Set([
    CONFIGURED,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
    "gemini-pro-latest",
  ]),
];

const PROMPT =
  "Use Google Search to find currently open grants for a small NGO doing STEM " +
  "education for youth in Kisumu, Kenya. Respond with ONLY a JSON array of " +
  "objects with fields name, funder, applicationUrl.";

const ai = new GoogleGenAI({ apiKey });

console.log(`\nGrounding check — configured search model: ${CONFIGURED}\n`);
console.log(
  "model".padEnd(26) + "time".padStart(6) + "chunks".padStart(8) +
  "queries".padStart(9) + "  grounded"
);
console.log("-".repeat(60));

const results = new Map();

for (const model of MODELS) {
  const t0 = Date.now();
  try {
    const res = await ai.models.generateContent({
      model,
      contents: PROMPT,
      config: { tools: [{ googleSearch: {} }], temperature: 0.3 },
    });
    const gm = res.candidates?.[0]?.groundingMetadata;
    const chunks = gm?.groundingChunks?.length ?? 0;
    const queries = gm?.webSearchQueries?.length ?? 0;
    // webSearchQueries is the load-bearing signal, not chunks. When the prompt
    // asks for bare JSON there is no prose for citations to attach to, so a
    // genuinely grounded call can return zero chunks and still have searched.
    const grounded = queries > 0;
    results.set(model, grounded);
    const secs = `${((Date.now() - t0) / 1000).toFixed(0)}s`;
    console.log(
      model.padEnd(26) + secs.padStart(6) + String(chunks).padStart(8) +
      String(queries).padStart(9) + "  " + (grounded ? "YES" : "NO  <-- ignored the tool")
    );
  } catch (err) {
    results.set(model, null);
    console.log(model.padEnd(26) + `  ERROR: ${String(err.message).slice(0, 60)}`);
  }
}

console.log("-".repeat(60));

const configuredOk = results.get(CONFIGURED);
if (configuredOk === true) {
  console.log(`\nOK: ${CONFIGURED} grounds. The app's search claim holds.\n`);
  process.exit(0);
}
if (configuredOk === null || configuredOk === undefined) {
  console.log(`\nWARNING: could not evaluate configured model ${CONFIGURED}.\n`);
  process.exit(1);
}
console.log(
  `\nFAIL: ${CONFIGURED} accepted the googleSearch tool and never ran it.\n` +
  `Every "grounded" result would actually be model memory. Change\n` +
  `GEMINI_SEARCH_MODEL to one marked YES above.\n`
);
process.exit(1);
