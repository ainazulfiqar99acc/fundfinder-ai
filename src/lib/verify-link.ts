import type { LinkStatus } from "@/types";

const TIMEOUT_MS = 6000;

/** Google's search-grounding chunks are opaque redirects, not funder pages. */
const GROUNDING_REDIRECT = "vertexaisearch.cloud.google.com/grounding-api-redirect/";

export interface LinkCheck {
  /** The URL after following redirects — what we actually show the user. */
  url: string;
  status: LinkStatus;
}

/**
 * Independently check that a grant URL the model produced actually resolves,
 * and report the URL it finally landed on.
 *
 * Two things make this more than a fetch:
 *
 * 1. The model sometimes copies a `vertexaisearch.../grounding-api-redirect/`
 *    URL straight out of its own grounding metadata into `applicationUrl`.
 *    Those are opaque and expire, so we follow them and keep the destination.
 *
 * 2. The verdict is deliberately asymmetric. We only say "broken" on positive
 *    evidence the page is not there — malformed URL, DNS failure, or the
 *    server itself saying 404/410. Anything ambiguous (timeouts, 403 from bot
 *    protection, rate limits, TLS quirks) is "unverified", because a funder's
 *    WAF blocking us is not evidence the grant is fake. Calling a real grant
 *    broken would be its own kind of lie.
 */
export async function checkLink(rawUrl: string): Promise<LinkCheck> {
  const url = rawUrl?.trim() ?? "";
  if (!url) return { url, status: "broken" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // The model emitted something that isn't a URL at all.
    return { url, status: "broken" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url, status: "broken" };
  }

  // Grounding redirects reject HEAD, so go straight to GET for those.
  const isRedirect = url.includes(GROUNDING_REDIRECT);

  if (!isRedirect) {
    const head = await attempt(parsed, "HEAD");
    if (head.status !== "retry") return { url: head.url ?? url, status: head.status };
  }

  const get = await attempt(parsed, "GET");
  return {
    url: get.url ?? url,
    status: get.status === "retry" ? "unverified" : get.status,
  };
}

async function attempt(
  url: URL,
  method: "HEAD" | "GET"
): Promise<{ status: LinkStatus | "retry"; url?: string }> {
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Without a browser-ish UA a lot of funder sites return 403 outright.
        "User-Agent":
          "Mozilla/5.0 (compatible; FundFinderAI/1.0; +https://github.com/)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });

    // res.url is the URL after redirects — this is what un-wraps a grounding link.
    const final = res.url || url.toString();

    if (res.ok) return { status: "verified", url: final };
    if (res.status === 404 || res.status === 410) return { status: "broken", url: final };
    // Method not allowed / not implemented — worth retrying as GET.
    if (res.status === 405 || res.status === 501) return { status: "retry", url: final };
    // 403, 429, 5xx: the page may well exist, we just can't see it.
    return { status: "unverified", url: final };
  } catch (err) {
    // DNS failure means the model invented a hostname that does not exist.
    if (isDnsFailure(err)) return { status: "broken" };
    // Timeouts, aborts, TLS errors: inconclusive.
    return { status: "retry" };
  }
}

function isDnsFailure(err: unknown): boolean {
  const code =
    (err as { cause?: { code?: string } })?.cause?.code ??
    (err as { code?: string })?.code;
  return code === "ENOTFOUND" || code === "EAI_AGAIN";
}
