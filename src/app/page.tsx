"use client";

import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import GrantCard from "@/components/GrantCard";
import LoiModal from "@/components/LoiModal";
import type { Grant, GrantSearchResult, NGOProfile } from "@/types";

export default function Home() {
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<GrantSearchResult | null>(null);
  const [profile, setProfile] = useState<NGOProfile | null>(null);

  const [draftingGrantId, setDraftingGrantId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [activeLoi, setActiveLoi] = useState<{ grant: Grant; letter: string } | null>(
    null
  );

  async function handleSearch(ngo: NGOProfile) {
    setSearching(true);
    setSearchError(null);
    setResult(null);
    setProfile(ngo);

    try {
      const res = await fetch("/api/match-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ngo),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Grant search failed.");
      }
      setResult(data as GrantSearchResult);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Grant search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleDraftLoi(grant: Grant) {
    if (!profile) return;
    setDraftingGrantId(grant.id);
    setDraftError(null);

    try {
      const res = await fetch("/api/draft-loi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, grant }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "LOI drafting failed.");
      }
      setActiveLoi({ grant, letter: data.letter as string });
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "LOI drafting failed.");
    } finally {
      setDraftingGrantId(null);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            FundFinderAI
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Describe your NGO once. Gemini searches the live web for currently
            open grants that fit, and drafts a tailored Letter of Inquiry.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ProfileForm onSubmit={handleSearch} loading={searching} />
        </section>

        {searchError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {searchError}
          </p>
        )}

        {draftError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {draftError}
          </p>
        )}

        {result && (
          <section className="flex flex-col gap-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <strong>Verify before acting:</strong> these matches come from
              live web search grounding but can still be incomplete or
              outdated. Confirm deadlines and eligibility on the funder&apos;s
              own page before applying.
            </div>

            {result.grants.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                No currently open grants were found with high confidence. Try
                broadening the focus areas or location.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {result.grants.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    onDraftLoi={handleDraftLoi}
                    drafting={draftingGrantId === grant.id}
                  />
                ))}
              </div>
            )}

            {result.searchQueries.length > 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  What Gemini searched
                </h2>
                <p className="mb-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  The searches actually run against Google for this result —
                  this is the evidence grounding happened rather than recall.
                  It is a search trail, not a citation list: it does not map
                  one-to-one onto the grants above. The per-grant evidence is
                  the link check on each card.
                </p>
                <ul className="flex flex-col gap-1.5">
                  {result.searchQueries.map((q) => (
                    <li
                      key={q}
                      className="font-mono text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="text-zinc-400 dark:text-zinc-600">
                        &gt;{" "}
                      </span>
                      {q}
                    </li>
                  ))}
                </ul>

                {result.sources.length > 0 && (
                  <>
                    <h3 className="mt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Pages retrieved
                    </h3>
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {result.sources.map((source) => (
                        <li key={source.uri} className="text-sm">
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
                          >
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              result.grants.length > 0 && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  <strong>Gemini ran no searches for this result.</strong> It
                  answered from training data rather than the live web, so
                  these grants carry a real risk of being closed, changed, or
                  never having existed. The link check on each card is the only
                  evidence here — treat everything else as unconfirmed.
                </p>
              )
            )}
          </section>
        )}
      </main>

      {activeLoi && (
        <LoiModal
          grant={activeLoi.grant}
          letter={activeLoi.letter}
          onClose={() => setActiveLoi(null)}
        />
      )}
    </div>
  );
}
