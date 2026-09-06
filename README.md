# FundFinderAI — Grant Radar with Grounded Matching

**Category:** Best Use of Google AI (Gemini API)

## The Hook
Laser-targeted to the defining 2025–26 NGO sector crisis (the collapse of USAID funding). Grounding
ensures matches are real, not AI hallucinations.

## What It Does
A small NGO describes its mission once. Gemini then uses Search grounding, URL context, and structured
output to find currently open grants that fit the NGO and drafts tailored Letters of Inquiry (LOIs).

## Architecture
Gemini 3 Pro/Flash with Google Search grounding + URL context
→ structured JSON of matching grants
→ draft generator
→ Next.js frontend

## Weekend MVP
Input an NGO profile → get a grounded grant list + one drafted LOI out.

## Key Challenge & Fix
**Challenge:** Grounding accuracy and hallucinated links.
**Fix:** Force the UI to display the sources clearly and add prominent "verify before acting"
disclaimers.

## The Demo
Paste an NGO profile in, watch live grants populate, and see the tailored draft generate.

## Getting Started

1. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your-key-here
   ```
2. Install dependencies (already done if you cloned this repo as-is):
   ```
   npm install
   ```
3. Run the dev server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000), fill in an NGO profile, and submit.

Model IDs used for search grounding and LOI drafting default to `gemini-2.5-flash` and can be
overridden via the `GEMINI_SEARCH_MODEL` / `GEMINI_DRAFT_MODEL` env vars if your account has access
to newer models.
