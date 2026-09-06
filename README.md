# FundFinderAI

**Live: https://fundfinder-ai.vercel.app**

A grant radar for small NGOs. Describe your organisation once; Gemini searches
the live web for currently open grants that fit, and drafts a tailored Letter
of Inquiry for any of them.

Built for the [DEV Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03).

## Why the verification matters more than the search

An AI grant finder that invents a grant is worse than no grant finder. A
three-person NGO that spends a week preparing an application against a deadline
that never existed has lost something it cannot get back.

So the model is not trusted about whether a grant is reachable. Every
`applicationUrl` it produces is independently fetched before you ever see it,
and the result is shown on the card:

| Badge | Meaning |
|---|---|
| `✓ Link verified` | The page loads. |
| `→ Funder site` | The exact page the model named was gone; the funder's own site is live, so the card links there and shows the dead URL struck through. |
| `⚠ Link didn't resolve` | Positive evidence it is not there — malformed URL, DNS failure, or a 404/410 from the server. |
| `Link unverified` | Inconclusive — a timeout, or a 403 from bot protection. Not evidence of a fake. |

That last row is deliberate. A funder's WAF blocking us is not proof the grant
is fake, and calling a real grant broken would be its own kind of lie.

## The trap this project is actually about

The app claims its matches come from live Search grounding rather than model
memory. That claim is only true if the model actually runs the tool — and **a
model that ignores the tool does not tell you.** It returns fluent, plausible,
correctly-shaped JSON with no grounding metadata attached.

Three of the four models tested accept `googleSearch` and never call it:

```
model                       time  chunks  queries  grounded
------------------------------------------------------------
gemini-2.5-flash             17s       0        8  YES
gemini-flash-latest          11s       0        0  NO  <-- ignored the tool
gemini-3.1-pro-preview       38s       0        0  NO  <-- ignored the tool
gemini-pro-latest            27s       0        0  NO  <-- ignored the tool
```

Reproduce it yourself — this talks to the Gemini API and nothing else, and
exits non-zero if the model the app is configured with did not search:

```bash
npm run check-grounding
```

Note the `chunks` column: it is zero even for the grounded model. Grounding
*chunks* attach citations to prose, and this prompt asks for bare JSON, so
there is nothing to cite. `webSearchQueries` is the signal that grounding ran —
getting that wrong made a working configuration look broken.

## Running it

```bash
npm install
cp .env.local.example .env.local   # then add your key
npm run dev
```

`.env.local`:

```
GEMINI_API_KEY=your-key-here
# Must be a model that honours the googleSearch tool - see npm run check-grounding
GEMINI_SEARCH_MODEL=gemini-2.5-flash
# Drafting needs no grounding, so a stronger model is fine here.
# Preview ids are access-gated; if your key cannot call it, the app falls back
# to gemini-2.5-flash on its own.
GEMINI_DRAFT_MODEL=gemini-3.1-pro-preview
```

## Limits

- **Verification proves reachability, not truth.** A live page is not proof the
  grant is open, or that the deadline and eligibility on the card are right.
  That ceiling is real; the card says to confirm on the funder's page.
- **Eligibility is the model's reading**, not a checked fact.
- **No auth, no database.** Nothing you type is stored.

## Stack

Next.js 16 (App Router) on Vercel · `@google/genai` · Gemini with Google Search
grounding · TypeScript · Tailwind 4.
