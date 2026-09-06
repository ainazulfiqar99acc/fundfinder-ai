"use client";

import { useState } from "react";
import type { Grant } from "@/types";

export default function LoiModal({
  grant,
  letter,
  onClose,
}: {
  grant: Grant;
  letter: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; user can still select and copy manually.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Draft LOI — {grant.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              To: {grant.funder}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {grant.linkStatus === "broken" && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <strong>We could not reach this funder&apos;s page.</strong> The
              URL given for {grant.funder} did not resolve, so we cannot confirm
              this grant — or this funder — exists. Confirm independently before
              you spend any time on this letter.
            </p>
          )}
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            AI-generated draft. Review carefully, verify all facts and the
            funder&apos;s current guidelines, and personalize before sending.
          </p>
          <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 dark:text-zinc-200">
            {letter}
          </pre>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Close
          </button>
          <button
            onClick={copyLetter}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
