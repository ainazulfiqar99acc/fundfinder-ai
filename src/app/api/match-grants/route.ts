import { NextRequest, NextResponse } from "next/server";
import { extractJson, getGeminiClient, SEARCH_MODEL } from "@/lib/gemini";
import { checkLink } from "@/lib/verify-link";
import type { Grant, GrantSearchResult, GrantSource, NGOProfile } from "@/types";

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY." },
      { status: 500 }
    );
  }

  let profile: NGOProfile;
  try {
    profile = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!profile.name?.trim() || !profile.mission?.trim()) {
    return NextResponse.json(
      { error: "NGO name and mission are required." },
      { status: 400 }
    );
  }

  const prompt = `You are a grant research assistant helping small NGOs navigate the funding gap left by the 2025-2026 collapse of USAID funding.

Use Google Search to find CURRENTLY OPEN grant opportunities (not closed, not expired, not "coming soon") that are a strong fit for the NGO below. Prefer official foundation or funder pages over aggregator/directory sites when choosing the applicationUrl, and use URL context to confirm each page is real before including it.

For applicationUrl, give the funder's own public web address as you would type it into a browser (for example https://www.example.org/grants). Never return a search-result, tracking, or redirect address — in particular anything containing "vertexaisearch" or "grounding-api-redirect". If you are not confident of the exact page, give the funder's main grants page rather than guessing a deeper path, because a guessed path that does not exist is worse than a general one that does.

NGO PROFILE
Name: ${profile.name}
Mission: ${profile.mission}
Location / operating region: ${profile.location || "Not specified"}
Focus areas: ${profile.focusAreas || "Not specified"}
Annual budget size: ${profile.budgetSize || "Not specified"}
Target population: ${profile.targetPopulation || "Not specified"}

Find up to 6 real, currently open grants that fit this NGO.

Respond with ONLY a JSON array (no markdown fences, no prose before or after) where each item has exactly these fields:
[
  {
    "name": string,
    "funder": string,
    "description": string (1-2 sentences),
    "amount": string (funding range/amount, or "Not specified"),
    "deadline": string (date, or "Rolling", or "Not specified"),
    "eligibility": string (1 sentence on who can apply),
    "applicationUrl": string (direct URL to the grant or funder page),
    "matchReason": string (1 sentence on why this fits THIS NGO specifically)
  }
]

If you cannot find any currently open grants with high confidence, return an empty array [].`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { urlContext: {} }],
        temperature: 0.3,
      },
    });

    const text = response.text ?? "";

    let grants: Grant[] = [];
    try {
      const parsed = extractJson(text);
      if (Array.isArray(parsed)) {
        grants = parsed.map((g, i) => ({
          id: `grant-${i}-${Date.now()}`,
          name: String(g.name ?? "Untitled grant"),
          funder: String(g.funder ?? "Unknown funder"),
          description: String(g.description ?? ""),
          amount: String(g.amount ?? "Not specified"),
          deadline: String(g.deadline ?? "Not specified"),
          eligibility: String(g.eligibility ?? "Not specified"),
          applicationUrl: String(g.applicationUrl ?? ""),
          matchReason: String(g.matchReason ?? ""),
          linkStatus: "unverified",
        }));
      }
    } catch {
      return NextResponse.json(
        {
          error:
            "Gemini returned a response that could not be parsed as JSON. Try again.",
        },
        { status: 502 }
      );
    }

    // Hit every application URL to catch links the model invented, and keep
    // the URL it actually resolved to (this un-wraps grounding redirects).
    grants = await Promise.all(
      grants.map(async (grant) => {
        const { url, status, claimedUrl } = await checkLink(grant.applicationUrl);
        return { ...grant, applicationUrl: url, claimedUrl, linkStatus: status };
      })
    );

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const searchQueries = groundingMetadata?.webSearchQueries ?? [];

    const sources: GrantSource[] = [];
    const seen = new Set<string>();
    const chunks = groundingMetadata?.groundingChunks ?? [];
    for (const chunk of chunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title || uri || "";
      // Grounding returns housekeeping lookups (the model checking today's
      // date) alongside real pages. Those aren't sources for anything.
      if (/^current time information/i.test(title)) continue;
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        sources.push({ title, uri });
      }
    }

    const result: GrantSearchResult = {
      grants,
      sources,
      searchQueries: [...searchQueries],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("match-grants failed:", err);
    return NextResponse.json(
      { error: "Grant search failed. Please try again." },
      { status: 500 }
    );
  }
}
