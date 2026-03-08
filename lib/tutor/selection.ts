import type { Strategy } from "@/lib/sudoku/types";
import type { BKTProbabilityRow } from "@/lib/bkt/types";

/** Strategies we have questions for (naked_single, hidden_single only for now). */
export const TUTOR_STRATEGIES: Strategy[] = ["naked_single", "hidden_single"];

/** Default mastery when no row exists (same as p_learned). */
const DEFAULT_MASTERY = 0.05;

/** Very small time decay per day: mastery *= DECAY_PER_DAY^days */
const DECAY_PER_DAY = 0.999;

/**
 * Apply a small time decay to mastery based on updated_at.
 * Used only for selection so we occasionally revisit older skills.
 */
function decayedMastery(row: BKTProbabilityRow | undefined, now: Date): number {
  if (!row) return DEFAULT_MASTERY;
  const mastery = Number(row.mastery_probability);
  const updated = new Date(row.updated_at);
  const days = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0.05, mastery * Math.pow(DECAY_PER_DAY, days));
}

/**
 * Pick the next knowledge component to practice.
 * Prefers lowest (decayed) mastery; with probability SWITCH_PROB picks a random one for variety.
 */
const SWITCH_PROB = 0.25;

export function pickNextKC(
  probabilities: BKTProbabilityRow[],
  now: Date = new Date()
): Strategy {
  const strategies = TUTOR_STRATEGIES;
  if (strategies.length === 0) return "naked_single";

  const byKc = new Map<Strategy, BKTProbabilityRow>();
  for (const p of probabilities) {
    if (strategies.includes(p.knowledge_component as Strategy)) {
      byKc.set(p.knowledge_component as Strategy, p);
    }
  }

  if (Math.random() < SWITCH_PROB && strategies.length > 1) {
    return strategies[Math.floor(Math.random() * strategies.length)]!;
  }

  let best: Strategy = strategies[0]!;
  let bestMastery = decayedMastery(byKc.get(best), now);

  for (const kc of strategies) {
    const m = decayedMastery(byKc.get(kc), now);
    if (m < bestMastery) {
      bestMastery = m;
      best = kc;
    }
  }

  return best;
}

/** Return true if user has never had BKT data or all masteries are still at default (intro state). */
export function shouldShowIntro(
  probabilities: BKTProbabilityRow[],
  getMastery: (kc: Strategy) => number
): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("tutor-intro-done") === "true") return false;
  for (const kc of TUTOR_STRATEGIES) {
    if (getMastery(kc) > DEFAULT_MASTERY + 0.01) return false;
  }
  return true;
}
