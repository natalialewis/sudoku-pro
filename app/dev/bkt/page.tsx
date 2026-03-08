"use client";

import { useState } from "react";
import { useBKT } from "@/lib/bkt/hooks";
import { DEFAULT_BKT_PARAMS, type BKTProbabilityRow } from "@/lib/bkt/types";
import { MASTERY_THRESHOLD } from "@/lib/bkt/engine";
import { STRATEGIES, type Strategy } from "@/lib/sudoku/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DevBktPage() {
  const { probabilities, loading, error, refetch, recordObservation, getMastery } = useBKT();
  const [testKc, setTestKc] = useState<Strategy>("naked_single");
  const [testCorrect, setTestCorrect] = useState(true);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetMastery = async () => {
    if (!confirm("Delete all your BKT rows? Mastery will reset to default.")) return;
    setResetError(null);
    setResetSubmitting(true);
    try {
      const res = await fetch("/api/bkt", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to reset");
      }
      await refetch();
    } catch (e) {
      setResetError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleRecordTest = async () => {
    setTestError(null);
    setTestSubmitting(true);
    try {
      await recordObservation(testKc, testCorrect);
      await refetch();
    } catch (e) {
      setTestError(e instanceof Error ? e.message : String(e));
    } finally {
      setTestSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:py-8">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Dev: BKT</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and test Bayesian Knowledge Tracing probabilities. Sign in to see your data.
        </p>

        <section className="mt-6">
          <h2 className="text-lg font-medium text-foreground">Reference</h2>
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs text-muted-foreground">
            <p>Default params: p_learned={DEFAULT_BKT_PARAMS.p_learned}, p_transit={DEFAULT_BKT_PARAMS.p_transit}, p_guess={DEFAULT_BKT_PARAMS.p_guess}, p_slip={DEFAULT_BKT_PARAMS.p_slip}</p>
            <p className="mt-1">Mastery threshold: {MASTERY_THRESHOLD}</p>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-foreground">Probabilities</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={loading}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Refetch
              </button>
              <button
                type="button"
                onClick={handleResetMastery}
                disabled={loading || resetSubmitting}
                className="rounded-lg border border-destructive bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {resetSubmitting ? "Resetting…" : "Reset mastery"}
              </button>
            </div>
          </div>
          {resetError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {resetError}
            </p>
          )}

          {loading && (
            <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
          )}

          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && probabilities.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              No BKT rows yet. Record an observation below or use the tutor to generate data.
            </p>
          )}

          {!loading && !error && probabilities.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 font-medium text-foreground">KC</th>
                    <th className="px-3 py-2 font-medium text-foreground">mastery</th>
                    <th className="px-3 py-2 font-medium text-foreground">p_learned</th>
                    <th className="px-3 py-2 font-medium text-foreground">p_transit</th>
                    <th className="px-3 py-2 font-medium text-foreground">p_guess</th>
                    <th className="px-3 py-2 font-medium text-foreground">p_slip</th>
                    <th className="px-3 py-2 font-medium text-foreground">updated_at</th>
                  </tr>
                </thead>
                <tbody>
                  {probabilities.map((row: BKTProbabilityRow) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="px-3 py-2 font-medium text-foreground">{row.knowledge_component}</td>
                      <td className="px-3 py-2 tabular-nums text-foreground">
                        {Number(row.mastery_probability).toFixed(4)}
                        {Number(row.mastery_probability) >= MASTERY_THRESHOLD && (
                          <span className="ml-1 text-primary">✓</span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{Number(row.p_learned).toFixed(4)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{Number(row.p_transit).toFixed(4)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{Number(row.p_guess).toFixed(4)}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{Number(row.p_slip).toFixed(4)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">getMastery(kc) — used by tutor</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-foreground">
                {STRATEGIES.map((kc) => (
                  <li key={kc}>
                    {kc}: {(getMastery(kc)).toFixed(4)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-foreground">Record test observation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            POST /api/bkt with a knowledge component and correct/incorrect to update BKT.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <span>KC</span>
              <select
                value={testKc}
                onChange={(e) => setTestKc(e.target.value as Strategy)}
                className="rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <span>Result</span>
              <select
                value={testCorrect ? "correct" : "incorrect"}
                onChange={(e) => setTestCorrect(e.target.value === "correct")}
                className="rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              >
                <option value="correct">Correct</option>
                <option value="incorrect">Incorrect</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleRecordTest}
              disabled={testSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {testSubmitting ? "Recording…" : "Record"}
            </button>
          </div>
          {testError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {testError}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
