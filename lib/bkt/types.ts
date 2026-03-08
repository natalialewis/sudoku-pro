import type { Strategy } from "@/lib/sudoku/types";

/** Knowledge component = strategy name in our system. */
export type KnowledgeComponent = Strategy;

/** BKT parameters for a single knowledge component. */
export interface BKTParams {
  p_learned: number; // p(L0) - initial probability of knowing the skill
  p_transit: number; // p(T) - probability of learning after practice
  p_guess: number; // p(G) - probability of guessing correctly when not knowing
  p_slip: number; // p(S) - probability of slipping when knowing
}

/** Row from bkt_probabilities table. */
export interface BKTProbabilityRow extends BKTParams {
  id: string;
  user_id: string;
  knowledge_component: KnowledgeComponent;
  mastery_probability: number; // Current P(L|obs)
  updated_at: string;
}

/** Default BKT parameters. p_guess high / p_transit low so mastery takes ~5× longer (~75+ correct). */
export const DEFAULT_BKT_PARAMS: BKTParams = {
  p_learned: 0.05,
  p_transit: 0.02,
  p_guess: 0.4,
  p_slip: 0.05,
};
