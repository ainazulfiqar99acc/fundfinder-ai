<!--
IMAGE PLAN  (these comments do not render; safe to leave in)

  COVER  set in the dev.to editor sidebar, NOT in this body. 1000x420.
         See the generation prompt in the handoff notes.

  [1] hero gif      media/fundfinder-demo.gif      -> in Demo, under the live link
      Replace with the hand-recorded take when it exists; same filename,
      same URL, nothing else changes.

  [2] caught link   media/04-link-caught.png       -> in Demo, under the results block
      The Hansen card badged "didn't resolve", with the grounding panel
      beneath it listing that same funder under "Pages retrieved".

  [3] LOI modal     media/06-loi-modal.png         -> in Demo, near the end

  OPTIONAL [4] media/02-searching.png  -> could sit beside the "It is slow"
      bullet in Limitations: the live panel, elapsed counter and skeletons.
      Only add it if the post feels thin on visuals; three is enough.

  All three are committed and served from raw.githubusercontent.com, so the
  post renders anywhere it is pasted with no editor upload step.
-->

*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## What I Built

The money exists. A small NGO just cannot find it.

That is what a generosity problem looks like at the small end. The giving has already happened — foundations with open, rolling, unclaimed programmes, sitting there — and it is spread across a few thousand pages nobody has time to read. After the 2025–26 collapse of USAID funding, organisations that had one funder now need six, and the people doing that searching are the same people running the programme: a director who is also the grant writer, working evenings. Generosity is not the scarce thing here. Attention is.

So an AI grant finder is an obvious idea. It is also a dangerous one, because the failure mode is not "unhelpful." A three-person NGO that spends a week writing an application against a deadline that never existed has lost a week it cannot get back, and it will not find out until it submits. The tool would have taken the one thing that was actually scarce.

**FundFinderAI** is the response, in one sentence: it searches the live web for currently open grants that fit your NGO, and then it refuses to trust its own model about any of them. Every application URL Gemini produces is independently fetched before you see it, and the card tells you what happened when we tried.

The interesting part is not that it searches. It is everything the app does to establish that the search actually happened and that the result actually exists.

## Demo

**Live: [fundfinder-ai.vercel.app](https://fundfinder-ai.vercel.app)** — describe an NGO, get grants, open a drafted Letter of Inquiry.

<!-- [1] hero gif — swap the file, keep the URL -->
![An NGO profile goes in; Gemini searches, every returned link is checked, and verified grants come back](https://raw.githubusercontent.com/ainazulfiqar99acc/fundfinder-ai/main/media/fundfinder-demo.gif)

Give it 30–120 seconds. It is running ten to thirty real Google searches and then fetching every URL that comes back, and the page shows you the clock while it does. Paste this in if you would rather not invent an NGO:

> **NGO name:** Kisumu STEM Girls Collective
> **Location:** Kisumu, Kenya
> **Mission:** We run after-school robotics and coding clubs for girls aged 12-17 in Kisumu, Kenya, and train their teachers to keep the clubs running.
> **Focus areas:** STEM education, girls education, teacher training
> **Annual budget size:** Under $250,000 annually
> **Target population:** Adolescent girls in low-income neighbourhoods of Kisumu

You will not get my results. They vary run to run — which is itself the point, and is in Limitations.

A real, unmodified run against the deployed app, for a girls' STEM education NGO in Kisumu, Kenya. Gemini ran **26 Google searches** and returned five grants, sorted so the ones that survived checking lead:

```
✓ verified     Ambassador's Special Self-Help Fund      U.S. Embassy Kenya
✓ verified     Seed Grants                              The Pollination Project
✓ verified     Overseas Aid Trust grants                Blackfriars (BOAT)
  unverified   Grassroots Human Security Projects       Embassy of Japan in Kenya
⚠ didn't       Hansen Family Foundation Grant           Hansen Family Foundation
  resolve
```

![A dead funder link caught, with the grounding panel below it listing that same funder among the pages Google retrieved](https://raw.githubusercontent.com/ainazulfiqar99acc/fundfinder-ai/main/media/04-link-caught.png)

The bottom row is the product working — and the grounding panel on that same page lists `hansenfamilyfoundation.org` among the pages it retrieved. Google's index has that funder. The live site does not answer. **Grounding retrieved it and the URL is still dead** — which is the entire argument for checking rather than trusting, in one row.

Ask for a Letter of Inquiry against a grant in that state and the app says so in red before you write a word: *we could not reach this funder's page, so we cannot confirm this grant — or this funder — exists.* Drafting a warm, professional letter to an organisation that may not exist is the failure this whole project is against, and the button that does it should not be silent about it.

An earlier run caught a harder one: `au-eu-youthlab.com`, a confident, plausible, entirely non-existent domain. DNS does not resolve it. It never reached the user.

When the link does check out, a second Gemini call drafts the letter — carrying its own standing caution, because a first draft is not a submission:

![The drafted Letter of Inquiry, carrying its own standing caution that it is an AI draft to be checked before sending](https://raw.githubusercontent.com/ainazulfiqar99acc/fundfinder-ai/main/media/06-loi-modal.png)

### You do not have to take the screenshots on faith

This is a post about plausible output not being proof, so the central claim — that the app searches rather than remembers — ships as a runnable check. It talks to the Gemini API and nothing else: not my server, not my code paths. About thirty seconds:

```bash
git clone https://github.com/ainazulfiqar99acc/fundfinder-ai && cd fundfinder-ai
npm install
cp .env.local.example .env.local   # then put your key in it
npm run check-grounding
```

It prints which models actually honour `googleSearch` and **exits non-zero if the one this app is configured with did not search.** The table it produces is further down.

## Code

{% github ainazulfiqar99acc/fundfinder-ai %}

Four files carry the argument:

- [`src/lib/verify-link.ts`](https://github.com/ainazulfiqar99acc/fundfinder-ai/blob/main/src/lib/verify-link.ts) — the gate. The asymmetry between `broken` and `unverified` is the whole design, and the comments say why.
- [`scripts/check-grounding.mjs`](https://github.com/ainazulfiqar99acc/fundfinder-ai/blob/main/scripts/check-grounding.mjs) — the four-model grounding check above.
- [`src/app/api/match-grants/route.ts`](https://github.com/ainazulfiqar99acc/fundfinder-ai/blob/main/src/app/api/match-grants/route.ts) — the grounded call, the prompt rule that every funder must have appeared in a search result, and verified-first ranking.
- [`src/types/index.ts`](https://github.com/ainazulfiqar99acc/fundfinder-ai/blob/main/src/types/index.ts) — four link states, with the reasoning for each written into the type.

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

### Turning recall up, and watching precision fall over

With grounding correctly on, a search for the Kisumu NGO came back with **zero grants** — "no currently open grants were found with high confidence" — while the search panel showed ten real Google searches. The model had looked and then declined to commit.

My first instinct was that the gate makes conservatism unnecessary: let the model offer plausible funders and let verification sort them out. So I told it that returning an empty list was a failure, and that a funder whose exact call it could not confirm still belonged in the results.

That worked, and it was a bad trade. Results went from zero to six — and **five of the six links were dead.** Not guessed paths on real funders, which the fallback handles: dead *domains*. Told to reach a number, the model had begun assembling organisations that sound exactly like real grantmakers and do not exist.

The rule that fixed it draws the line at the search result rather than at confidence:

> Every single one must be an organisation that actually appeared in your search results. If you did not see the funder in a search result, it does not go in the list, however plausible it sounds. Three real funders is a good answer; six with two invented ones is a bad answer, because the reader cannot tell which is which.

Plus the same rule for the URL, which is the part most easily fabricated: use the address as it appeared, and if you did not see one, use the funder's homepage — a short address is far likelier to be real than a guessed `/grants/apply-2026`.

Same profile, after: five grants, three verified, one inconclusive, one caught. A later run on the same profile came back four for four. The gate's job is to catch what slips through, not to license the model to guess — and the better the rule got, the less often the gate had anything to do.

### The bug in the gate itself

Worth admitting, because it is the same class of error as everything above. The funder-site fallback — the thing that rescues a real funder whose deep path the model guessed — was very nearly dead code. `checkLink` tried `HEAD` first and returned immediately on any settled verdict, and a 404 is a settled verdict, so the ordinary case (a well-behaved server answering `HEAD` with 404) returned `broken` and never reached the root probe below it. The fallback only ever fired for servers that reject `HEAD` outright.

The feature worked in the demo, was described accurately in the README, and was unreachable for the exact case it was written for. The fix is one condition — let `broken` fall through instead of returning — and it is why real funders now surface as their homepage instead of a dead end.

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
- **Grounded results are narrower.** Turning grounding on cut a six-grant answer to three-to-five. That is the honest number, and the six were partly fiction.
- **It is slow.** 30–120 seconds per search, because 10–30 real Google searches happen and then every URL returned is fetched. That is the cost of not guessing, but it is a real cost and I have not hidden it behind a fake progress bar.
- **Results vary between identical runs.** The same profile returns different funders each time, and the caught-link rate moves with it. There is no seed to pin.

## Prize Categories

**Best Use of Google AI.**

Gemini is used twice, and the interesting engineering is in refusing to trust it both times.

1. **Search grounding is treated as a claim to be checked, not a setting to be enabled.** Three of four models tested accept `googleSearch` and silently never run it, producing a fully convincing ungrounded app. `npm run check-grounding` is a committed, runnable test of that premise that exits non-zero when it fails. The search call passes two Google tools — `googleSearch` to retrieve, and `urlContext` so the model reads candidate funder pages rather than only their snippets — and the app then re-fetches every URL itself anyway. A tool the model *may* have invoked is not evidence that it did.
2. **`webSearchQueries`, not `groundingChunks`, is the proof grounding ran** — a distinction that a bare-JSON prompt makes load-bearing, and getting it wrong made a correct configuration look broken.
3. **The model's output is externally verified before display.** Every URL is fetched; verdicts are asymmetric so ambiguity never becomes a false accusation; dead deep paths fall back to the funder's live site with the invented URL shown struck through.
4. **The second call is deliberately unglamorous.** LOI drafting needs no grounding, so it uses the stronger model with no tools — the two calls are configured for what they actually need rather than uniformly.

Remove Gemini and there is no product. Remove the verification and there is something worse than no product: a confident list of grants, some of which do not exist, handed to people who cannot afford to find out the hard way.
