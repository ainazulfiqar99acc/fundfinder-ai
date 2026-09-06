import type { Grant, LinkStatus } from "@/types";

export const LINK_BADGES: Record<
  LinkStatus,
  { label: string; className: string; hint: string }
> = {
  verified: {
    label: "✓ Link verified",
    className:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    hint: "We fetched this URL and it returned a page. That confirms the page exists — not that the grant is open, or that its deadline is right.",
  },
  "funder-site": {
    label: "→ Funder site (named page was gone)",
    className:
      "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    hint: "The exact page Gemini named did not resolve. This links the funder's own site instead.",
  },
  broken: {
    label: "⚠ Link didn't resolve",
    className: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300",
    hint: "Bad hostname, or the server returned 404. Treat this grant as unconfirmed.",
  },
  unverified: {
    label: "Link unverified",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    hint: "The check was inconclusive — the site blocked us or timed out. That is not evidence the grant is fake.",
  },
};

export default function GrantCard({
  grant,
  onDraftLoi,
  drafting,
}: {
  grant: Grant;
  onDraftLoi: (grant: Grant) => void;
  drafting: boolean;
}) {
  // This whole project rests on not trusting model-supplied URLs, so never
  // render one as a live href without checking the scheme. verify-link returns
  // the raw string unchanged when it rejects it, which can include javascript:
  // or data: — React will happily render either.
  const safeUrl = /^https?:\/\//i.test(grant.applicationUrl)
    ? grant.applicationUrl
    : "";
  const badge = LINK_BADGES[grant.linkStatus];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {grant.name}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {grant.funder}
          </p>
        </div>
        <span className="max-w-[45%] shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-right text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {grant.amount}
        </span>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {grant.description}
      </p>

      <div className="grid grid-cols-1 gap-3 text-xs text-zinc-500 sm:grid-cols-2 dark:text-zinc-400">
        <div>
          <div className="font-medium text-zinc-600 dark:text-zinc-300">
            Deadline
          </div>
          {grant.deadline}
        </div>
        <div>
          <div className="font-medium text-zinc-600 dark:text-zinc-300">
            Eligibility
          </div>
          {grant.eligibility}
        </div>
      </div>

      <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <span className="font-medium">Why it matches: </span>
        {grant.matchReason}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-3">
        {safeUrl ? (
          <>
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
            >
              View grant page ↗
            </a>
            <span
              title={badge.hint}
              className={`cursor-help rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
            {grant.claimedUrl && (
              <span className="w-full break-all text-xs text-zinc-500 dark:text-zinc-400">
                Gemini named{" "}
                <span className="font-mono line-through">
                  {grant.claimedUrl}
                </span>
                , which did not resolve.
              </span>
            )}
          </>
        ) : (
          <span
            title="Gemini returned no usable web address for this grant, so nothing about it could be checked."
            className="cursor-help rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300"
          >
            ⚠ No link given — nothing could be checked
          </span>
        )}
        <button
          onClick={() => onDraftLoi(grant)}
          disabled={drafting}
          className="ml-auto inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {drafting ? "Drafting…" : "Draft LOI"}
        </button>
      </div>
    </div>
  );
}
