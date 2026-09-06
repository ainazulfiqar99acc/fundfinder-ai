*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## What I Built

The money exists. A small NGO just cannot find it.

After the 2025–26 collapse of USAID funding, organisations that had one funder now need six. The people doing that search are usually the same people running the programme — a director who is also the grant writer, working evenings. Foundation money is sitting there, open, unclaimed, spread across a few thousand pages nobody has time to read.

So an AI grant finder is an obvious idea. It is also a dangerous one, because the failure mode is not "unhelpful." A three-person NGO that spends a week writing an application against a deadline that never existed has lost a week it cannot get back, and it will not find out until it submits.

**FundFinderAI** describes the problem in one sentence: it searches the live web for currently open grants that fit your NGO, and then it does not trust its own model about any of them. Every application URL Gemini produces is independently fetched before you see it, and the card tells you what happened when we tried.

**In one line:** the interesting part is not that it searches — it's everything the app does to establish that the search actually happened and that the result actually exists.

## Demo

**Live: [fundfinder-ai.vercel.app](https://fundfinder-ai.vercel.app)** — describe an NGO, get grants, open a drafted Letter of Inquiry.

<!-- TODO: record and paste the demo gif here -->

Here is a real, unmodified run from the deployed app, for a girls' STEM education NGO in Kisumu, Kenya. Gemini ran **25 Google searches** and returned four grants:

```
[verified]    Innovating Education in Africa (IEA) 2026 Call for Submissions
              -> au.int/en/announcements/20260331/call-submissions-...

[verified]    Draper Richards Kaplan Foundation Social Entrepreneurship Funding
              -> drkfoundation.org/apply/overview/

[verified]    Funding for Women-Led Initiatives in Africa
              -> gfmd.info/fundings/funding-for-women-led-initiatives-in-africa/

[funder-site] Young Innovators Challenge 2026
              -> kcdf.or.ke/
              Gemini named kcdf.or.ke/opportunities/ , which did not resolve.
```

That last row is the product working. The Kenya Community Development Foundation is a real funder. `/opportunities/` is not a real page. The card links KCDF's live site instead and shows the invented URL struck through, rather than quietly repairing it or quietly shipping a dead link.

An earlier live run caught a harder one: `au-eu-youthlab.com` — a confident, plausible, entirely non-existent domain. DNS does not resolve it. It never reached the user.

## Code

{% github unicorn-9-spec/fundfinder-ai %}

## How I Built It

### The trap: a model can decline to search and never say so

The premise is live Search grounding. The app was configured with `gemini-3.1-pro-preview` and passed `tools: [{ googleSearch: {} }]`, and it returned six well-formed, plausible grants in sixty seconds. It looked like it worked.

It was not searching at all.

The response carried no `groundingMetadata` — the candidate had only `content`, `finishReason`, `index`. No error, no warning, no refusal. The model accepted a tool it does not run and answered from memory, in exactly the shape I asked for. The tell was in the output, not the API: that run invented an application URL.

This generalises further than one model. Sending one identical grounded prompt to four models:

```
model                       time  chunks  queries  grounded
------------------------------------------------------------
gemini-2.5-flash             17s       0        8  YES
gemini-flash-latest          11s       0        0  NO  <-- ignored the tool
gemini-3.1-pro-preview       38s       0        0  NO  <-- ignored the tool
gemini-pro-latest            27s       0        0  NO  <-- ignored the tool
```

Three of four accept `googleSearch` and never call it. Any of them would have produced a working, convincing, ungrounded app.

That check is committed as `npm run check-grounding`. It talks to the Gemini API and nothing else — not my server, not my code paths — and **exits non-zero if the model the app is configured with did not actually search.** If the premise of this project ever stops being true, that command fails.

### The second trap, which was mine

My first version of that check asked whether `groundingChunks` came back non-empty. By that measure `gemini-2.5-flash` was also ungrounded, and I nearly changed the model a second time chasing it.

Look at the `chunks` column above: it is zero for the model that *is* grounded. Grounding chunks attach citations to prose, and this prompt demands bare JSON with no prose in it, so there is nothing for a citation to attach to. The signal that grounding ran is `webSearchQueries` — the actual searches issued.

That mistake was live in the UI too. The app showed a red "Gemini may have answered from its training data" warning whenever chunks were empty, which meant it accused itself of hallucinating on runs where it had correctly searched eight times. The fix was to report the searches, which is also just better: the panel now shows the literal queries Gemini ran, which is far more meaningful to a user than a list of opaque `vertexaisearch` redirect URLs.

### The gate, and why its verdicts are deliberately lopsided

`src/lib/verify-link.ts` fetches every URL the model produced. What matters is what it refuses to conclude:

- **`broken`** only on positive evidence the page is not there: a malformed URL, a DNS failure, or a 404/410 from the server itself.
- **`unverified`** for everything ambiguous — timeouts, 403s from bot protection, rate limits, TLS quirks.

A funder's firewall blocking a robot is not evidence the grant is fake. Marking a real grant broken would be the same category of harm as inventing one, pointed the other way, so the check is built to be unsure out loud rather than confidently wrong.

Two smaller things fell out of real runs. The model sometimes copies an opaque `vertexaisearch.../grounding-api-redirect/` URL straight out of its own grounding metadata into `applicationUrl`, so those get followed and replaced with wherever they land. And a dead deep path on a live domain turned out to be the single most common failure — real funder, guessed page — so the check retries the origin and offers the funder's own site under a distinct badge.

### Honest note on the failures shown here

Every failure in this post came out of a live, unmodified run against the deployed app. I did not corrupt a fixture or hand-write a bad response to make the gate look busy. The model produced `au-eu-youthlab.com` and `ned.org/apply-for-a-grant/` on its own, and both are exactly the kind of thing that would have cost somebody a week.

## Limitations, plainly

- **Reachability is not truth.** A page that loads is not proof the grant is open, or that the deadline and eligibility on the card are correct. The gate raises the floor; it does not certify a grant. Every card says to confirm on the funder's page, and it means it.
- **Eligibility and match reasoning are the model's reading**, unverified by anything.
- **The LOI is a first draft**, not a submission. It is there to get past a blank page.
- **No real NGO has used this.** It is tested against profiles I wrote.
- **Grounded results are narrower.** Turning grounding on cut a six-grant answer to three or four. That is the honest number, and the six were partly fiction.

## Prize Categories

**Best Use of Google AI.**

Gemini is used twice, and the interesting engineering is in refusing to trust it both times.

1. **Search grounding is treated as a claim to be checked, not a setting to be enabled.** Three of four models tested accept `googleSearch` and silently never run it, producing a fully convincing ungrounded app. `npm run check-grounding` is a committed, runnable test of that premise that exits non-zero when it fails.
2. **`webSearchQueries`, not `groundingChunks`, is the proof grounding ran** — a distinction that a bare-JSON prompt makes load-bearing, and getting it wrong made a correct configuration look broken.
3. **The model's output is externally verified before display.** Every URL is fetched; verdicts are asymmetric so ambiguity never becomes a false accusation; dead deep paths fall back to the funder's live site with the invented URL shown struck through.
4. **The second call is deliberately unglamorous.** LOI drafting needs no grounding, so it uses the stronger model with no tools — the two calls are configured for what they actually need rather than uniformly.

Remove Gemini and there is no product. Remove the verification and there is something worse than no product: a confident list of grants, some of which do not exist, handed to people who cannot afford to find out the hard way.
