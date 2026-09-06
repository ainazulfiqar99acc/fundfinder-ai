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

/**
 * "unverified" means inconclusive (bot-blocked, timeout), not "bad".
 * "funder-site" means the exact page the model named was gone, but the
 * funder's own site is live and we fell back to it.
 */
export type LinkStatus = "verified" | "funder-site" | "broken" | "unverified";

export interface Grant {
  id: string;
  name: string;
  funder: string;
  description: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applicationUrl: string;
  /**
   * The URL the model originally claimed, when it differs from
   * applicationUrl — i.e. the dead page we fell back from. Kept so the UI can
   * show what was actually claimed rather than quietly swapping it.
   */
  claimedUrl?: string;
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
