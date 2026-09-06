import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, DRAFT_MODEL } from "@/lib/gemini";
import type { Grant, NGOProfile } from "@/types";

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY." },
      { status: 500 }
    );
  }

  let body: { profile: NGOProfile; grant: Grant };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { profile, grant } = body;
  if (!profile?.name?.trim() || !grant?.name?.trim()) {
    return NextResponse.json(
      { error: "NGO profile and grant are required." },
      { status: 400 }
    );
  }

  const prompt = `Draft a concise, professional Letter of Inquiry (LOI) from the NGO below to the funder below, requesting consideration for the described grant.

NGO PROFILE
Name: ${profile.name}
Mission: ${profile.mission}
Location: ${profile.location || "Not specified"}
Focus areas: ${profile.focusAreas || "Not specified"}
Annual budget size: ${profile.budgetSize || "Not specified"}
Target population: ${profile.targetPopulation || "Not specified"}

GRANT
Funder: ${grant.funder}
Grant name: ${grant.name}
Description: ${grant.description}
Eligibility: ${grant.eligibility}
Amount: ${grant.amount}
Deadline: ${grant.deadline}

Write a 3-4 paragraph LOI (under 400 words) covering: (1) a brief introduction of the NGO and its mission, (2) why this specific grant is a fit, referencing the grant's stated purpose, (3) a concise description of the project/need this funding would support, and (4) a closing call to action inviting further conversation.

Use a professional, warm, non-generic tone. Do not invent specific statistics, past grant history, or named staff that were not provided in the NGO profile above — keep those parts general. Output plain text only, no markdown formatting. End with a signature block using the placeholders [Contact Name] and [Contact Email].`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: DRAFT_MODEL,
      contents: prompt,
      config: { temperature: 0.6 },
    });

    const letter = response.text ?? "";
    if (!letter.trim()) {
      return NextResponse.json(
        { error: "Gemini returned an empty draft. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ letter });
  } catch (err) {
    console.error("draft-loi failed:", err);
    return NextResponse.json(
      { error: "LOI drafting failed. Please try again." },
      { status: 500 }
    );
  }
}
