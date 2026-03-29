import { createSupabaseClient } from "@/lib/supabase/client";
import type { Board, Strategy } from "@/lib/sudoku/types";
import type { Difficulty } from "@/lib/sudoku/boardGenerator";
import type {
  MiniPairAnswer,
  MiniSingleAnswer,
  NotesGrid,
} from "@/lib/sudoku/miniBoardGenerators";

function asBoard(v: unknown): Board {
  if (!Array.isArray(v) || v.length !== 9) throw new Error("Invalid board JSON");
  return v.map((row) => {
    if (!Array.isArray(row) || row.length !== 9) throw new Error("Invalid board row");
    return row.map((n) => Number(n));
  }) as Board;
}

function parseMiniAnswer(raw: unknown): MiniSingleAnswer | MiniPairAnswer {
  if (!raw || typeof raw !== "object") throw new Error("mini_answer missing or invalid");
  const o = raw as Record<string, unknown>;
  if (o.kind === "single") {
    return {
      kind: "single",
      row: Number(o.row),
      col: Number(o.col),
      value: Number(o.value),
    };
  }
  if (o.kind === "pair") {
    const cells = o.cells as unknown;
    if (!Array.isArray(cells) || cells.length !== 2) throw new Error("pair cells invalid");
    const a = cells[0] as Record<string, unknown>;
    const b = cells[1] as Record<string, unknown>;
    const digits = o.digits as unknown;
    if (!Array.isArray(digits) || digits.length !== 2) throw new Error("pair digits invalid");
    const unit = o.unit as Record<string, unknown>;
    return {
      kind: "pair",
      cells: [
        { row: Number(a.row), col: Number(a.col) },
        { row: Number(b.row), col: Number(b.col) },
      ],
      digits: [Number(digits[0]), Number(digits[1])],
      unit: {
        type: unit.type as MiniPairAnswer["unit"]["type"],
        index: Number(unit.index),
      },
    };
  }
  throw new Error("mini_answer.kind not recognized");
}

function parseNotesGrid(raw: unknown): NotesGrid | null {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length !== 9) throw new Error("initial_notes invalid");
  return raw.map((row) => {
    if (!Array.isArray(row) || row.length !== 9) throw new Error("initial_notes row invalid");
    return row.map((cell) => {
      if (cell == null) return [];
      if (Array.isArray(cell)) return cell.map((n) => Number(n));
      throw new Error("initial_notes cell invalid");
    });
  }) as NotesGrid;
}

export type MiniBoardFromDb = {
  initial: Board;
  solution: Board;
  initialNotes: NotesGrid | null;
  answer: MiniSingleAnswer | MiniPairAnswer;
};

/**
 * Random mini board for tutor: requires `mini_answer` set (seed script populates this).
 */
export async function fetchRandomMiniBoard(
  strategy: Strategy,
  difficultyLevel: number
): Promise<MiniBoardFromDb> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("boards")
    .select("initial_state, solution, initial_notes, mini_answer")
    .eq("board_type", "mini")
    .eq("strategy_focus", strategy)
    .eq("difficulty_level", difficultyLevel)
    .not("mini_answer", "is", null)
    .limit(80);

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error(
      `No mini boards found for ${strategy} at level ${difficultyLevel}. Seed the boards table (see scripts/seedBoards.ts) and ensure mini_answer is stored.`
    );
  }

  const row = data[Math.floor(Math.random() * data.length)]!;
  const answer = parseMiniAnswer(row.mini_answer);
  const initial = asBoard(row.initial_state);
  const solution = asBoard(row.solution);
  const initialNotes = parseNotesGrid(row.initial_notes);

  if (answer.kind === "pair" && !initialNotes) {
    throw new Error("Pair mini board in database is missing initial_notes");
  }

  return { initial, solution, initialNotes, answer };
}

export async function fetchRandomFullBoard(
  difficulty: Difficulty
): Promise<{ initial: Board; solution: Board }> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("boards")
    .select("initial_state, solution")
    .eq("board_type", "full")
    .eq("difficulty", difficulty)
    .limit(80);

  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error(
      `No full boards found for difficulty "${difficulty}". Seed the boards table (see scripts/seedBoards.ts).`
    );
  }

  const row = data[Math.floor(Math.random() * data.length)]!;
  return {
    initial: asBoard(row.initial_state),
    solution: asBoard(row.solution),
  };
}
