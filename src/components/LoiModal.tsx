"use client";

import { useEffect, useRef, useState } from "react";
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
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const closeRef = useRef<HTMLButtonElement>(null);
  // Whether the current gesture STARTED on the backdrop. Without this, dragging
  // a text selection out of the panel ends with mouseup on the backdrop, which
  // dispatches click there and destroys the letter the user was selecting.
  const startedOnBackdrop = useRef(false);

  // Mount-only: take focus, lock the background, and give focus back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  // Separate, so a new onClose identity rebinds the key handler without
  // re-stealing focus or re-locking scroll on every parent render.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopyState("ok");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Clipboard API unavailable (insecure context, some webviews). Say so —
      // a silent no-op is indistinguishable from a click that never landed,
      // and the user would paste stale contents into a funder email.
      setCopyState("fail");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        startedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && startedOnBackdrop.current) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loi-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <h2
              id="loi-title"
              className="font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Draft LOI — {grant.name}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              To: {grant.funder}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div tabIndex={0} className="overflow-y-auto p-5">
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
            {copyState === "ok"
              ? "Copied!"
              : copyState === "fail"
                ? "Copy failed — select the text"
                : "Copy to clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
