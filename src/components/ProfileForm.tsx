"use client";

import { useState } from "react";
import type { NGOProfile } from "@/types";

const EMPTY_PROFILE: NGOProfile = {
  name: "",
  mission: "",
  location: "",
  focusAreas: "",
  budgetSize: "",
  targetPopulation: "",
};

export default function ProfileForm({
  onSubmit,
  loading,
}: {
  onSubmit: (profile: NGOProfile) => void;
  loading: boolean;
}) {
  const [profile, setProfile] = useState<NGOProfile>(EMPTY_PROFILE);

  function update<K extends keyof NGOProfile>(key: K, value: NGOProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(profile);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="NGO name" required>
          <input
            required
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Riverbend Youth Alliance"
            className="input"
          />
        </Field>
        <Field label="Location / operating region">
          <input
            value={profile.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            className="input"
          />
        </Field>
      </div>

      <Field label="Mission" required>
        <textarea
          required
          value={profile.mission}
          onChange={(e) => update("mission", e.target.value)}
          placeholder="Describe what your NGO does, who it serves, and its goals."
          rows={4}
          className="input resize-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Focus areas">
          <input
            value={profile.focusAreas}
            onChange={(e) => update("focusAreas", e.target.value)}
            placeholder="e.g. education, health"
            className="input"
          />
        </Field>
        <Field label="Annual budget size">
          <input
            value={profile.budgetSize}
            onChange={(e) => update("budgetSize", e.target.value)}
            placeholder="e.g. under $100k"
            className="input"
          />
        </Field>
        <Field label="Target population">
          <input
            value={profile.targetPopulation}
            onChange={(e) => update("targetPopulation", e.target.value)}
            placeholder="e.g. rural women"
            className="input"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Searching for grants…" : "Find matching grants"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="text-emerald-700"> *</span>}
      </span>
      {children}
    </label>
  );
}
