import type { Grant, LinkStatus } from "@/types";

const LINK_BADGES: Record<LinkStatus, { label: string; className: string }> = {
  verified: {
    label: "✓ Link verified",
    className:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  broken: {
    label: "⚠ Link didn't resolve",
    className: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  unverified: {
    label: "Link unverified",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {grant.name}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {grant.funder}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {grant.amount}
        </span>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {grant.description}
      </p>

      <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
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
        {grant.applicationUrl ? (
          <>
            <a
              href={grant.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
            >
              View grant page ↗
            </a>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                LINK_BADGES[grant.linkStatus].className
              }`}
            >
              {LINK_BADGES[grant.linkStatus].label}
            </span>
          </>
        ) : (
          <span className="text-sm text-zinc-400">No link provided</span>
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
