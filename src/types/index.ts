export interface NGOProfile {
  name: string;
  mission: string;
  location: string;
  focusAreas: string;
  budgetSize: string;
  targetPopulation: string;
}

export interface GrantSource {
  title: string;
  uri: string;
}

/** "unverified" means inconclusive (bot-blocked, timeout), not "bad". */
export type LinkStatus = "verified" | "broken" | "unverified";

export interface Grant {
  id: string;
  name: string;
  funder: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applicationUrl: string;
  matchReason: string;
  linkStatus: LinkStatus;
}

export interface GrantSearchResult {
  grants: Grant[];
  sources: GrantSource[];
  /**
   * The actual Google searches the model ran. This — not `sources` — is the
   * proof that grounding happened: a bare-JSON answer has no prose for
   * citations to attach to, so a genuinely grounded call can return searches
   * with zero source chunks.
   */
  searchQueries: string[];
  generatedAt: string;
}
