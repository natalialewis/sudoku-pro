/**
 * Seed boards into the database.
 * Run with: npm run seed:boards
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (secret key) in env (or .env.local).
 *
 * Configurable counts per type - set to 0 to skip (e.g. naked_pair until implemented).
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
import {
  generateFullBoard,
  generateMiniBoardByStrategy,
  type Board,
  type Strategy,
  type Difficulty,
  type MiniBoardDifficulty,
} from "../lib/sudoku";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** Counts per type - set to 0 to skip. */
const COUNT_CONFIG = {
  full: {
    easy: 20,
    medium: 20,
    hard: 20,
  },
  mini: {
    naked_single: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5 },
    hidden_single: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5 },
    naked_pair: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5 },
    hidden_pair: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5 },
  },
};

function boardToJsonb(board: Board): unknown {
  return board;
}

async function seedFullBoards() {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  let inserted = 0;
  for (const diff of difficulties) {
    const count = COUNT_CONFIG.full[diff];
    if (count <= 0) continue;
    for (let i = 0; i < count; i++) {
      const { initial, solution } = generateFullBoard(diff);
      const { error } = await supabase.from("boards").insert({
        board_type: "full",
        difficulty: diff,
        strategy_focus: null,
        difficulty_level: null,
        initial_state: boardToJsonb(initial),
        solution: boardToJsonb(solution),
      });
      if (error) {
        console.error(`Full ${diff} #${i + 1}:`, error.message);
      } else {
        inserted++;
      }
    }
  }
  return inserted;
}

async function seedMiniBoards() {
  const strategies: Strategy[] = [
    "naked_single",
    "hidden_single",
    "naked_pair",
    "hidden_pair",
  ];
  let inserted = 0;
  for (const strategy of strategies) {
    const levels = COUNT_CONFIG.mini[strategy];
    for (let level = 1; level <= 10; level++) {
      const count = levels[level as MiniBoardDifficulty];
      if (count <= 0) continue;
      for (let i = 0; i < count; i++) {
        try {
          const res = generateMiniBoardByStrategy(
            strategy,
            level as MiniBoardDifficulty
          );
          const { error } = await supabase.from("boards").insert({
            board_type: "mini",
            difficulty: null,
            strategy_focus: strategy,
            difficulty_level: level,
            initial_state: boardToJsonb(res.initial),
            solution: boardToJsonb(res.solution),
            initial_notes: res.initialNotes ?? null,
            mini_answer: res.answer,
          });
          if (error) {
            console.error(`Mini ${strategy} L${level} #${i + 1}:`, error.message);
          } else {
            inserted++;
          }
        } catch (e) {
          console.error(`Mini ${strategy} L${level} #${i + 1}:`, e);
        }
      }
    }
  }
  return inserted;
}

async function main() {
  console.log("Seeding boards...");
  const fullCount = await seedFullBoards();
  console.log(`Full boards: ${fullCount}`);
  const miniCount = await seedMiniBoards();
  console.log(`Mini boards: ${miniCount}`);
  console.log(`Done. Total: ${fullCount + miniCount}`);
}

main().catch(console.error);
