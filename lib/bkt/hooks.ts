"use client";

import { useCallback, useEffect, useState } from "react";
import type { BKTProbabilityRow } from "./types";
import type { Strategy } from "@/lib/sudoku/types";

/**
 * React hook to fetch and update BKT probabilities.
 * @returns {Object} An object containing the BKT probabilities, loading state, error state, and functions to refetch, record observations, and get mastery probabilities.
 */
export function useBKT() {
  const [probabilities, setProbabilities] = useState<BKTProbabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetch the BKT probabilities.
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bkt");
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to fetch BKT probabilities");
      setProbabilities([]);
      return;
    }
    const { probabilities: data } = await res.json();
    setProbabilities(data ?? []);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Record an observation and update the BKT probabilities.
  const recordObservation = useCallback(
    async (
      knowledgeComponent: Strategy,
      correct: boolean,
      usedHint = false
    ): Promise<BKTProbabilityRow | null> => {
      const res = await fetch("/api/bkt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge_component: knowledgeComponent,
          correct,
          used_hint: usedHint,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record observation");
      }
      const { probability } = await res.json();
      await refetch();
      return probability;
    },
    [refetch]
  );

  // Get the mastery probability for a given knowledge component.
  const getMastery = useCallback(
    (kc: Strategy): number => {
      const row = probabilities.find((p) => p.knowledge_component === kc);
      return row ? Number(row.mastery_probability) : 0.05; // default p_learned
    },
    [probabilities]
  );

  // Return the BKT probabilities, loading state, error state, and functions to refetch, record observations, and get mastery probabilities.
  return {
    probabilities,
    loading,
    error,
    refetch,
    recordObservation,
    getMastery,
  };
}
