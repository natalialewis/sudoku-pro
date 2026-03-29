"use client";

import { useState } from "react";
import {
  generateFullBoard,
  generateMiniBoardByStrategy,
  type Board,
  type Strategy,
  type MiniBoardResult,
  STRATEGIES,
  type Difficulty,
  type MiniBoardDifficulty,
} from "@/lib/sudoku";
import { createSupabaseClient } from "@/lib/supabase/client";
import { StaticBoard } from "@/components/ui/StaticBoard";

// Counts clues in a board (rough estimate of difficulty)
function countClues(board: Board): number {
  let n = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) n++;
    }
  }
  return n;
}

// Board grid UI component
function BoardGrid({ board, label }: { board: Board; label: string }) {
  return (
    <div className="flex flex-col gap-0">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/70 bg-card">
        {board.map((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className={`flex h-8 w-8 items-center justify-center border border-border text-sm tabular-nums
                ${c === 2 || c === 5 ? "border-r-2 border-r-foreground/70" : ""}
                ${r === 2 || r === 5 ? "border-b-2 border-b-foreground/70" : ""}
              `}
            >
              {v === 0 ? "" : v}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type BoardSource = "functions" | "database";

// Main page component
function getMiniAnswerLabel(answer: MiniBoardResult["answer"]): string {
  if (answer.kind === "single") {
    return `single: row ${answer.row + 1}, col ${answer.col + 1}, value ${answer.value}`;
  }
  const [a, b] = answer.cells;
  return `pair: (${a.row + 1},${a.col + 1}) and (${b.row + 1},${b.col + 1}) on digits {${answer.digits[0]}, ${answer.digits[1]}} in ${answer.unit.type} ${answer.unit.index + 1}`;
}

function getPairCells(answer?: MiniBoardResult["answer"]) {
  if (!answer || answer.kind !== "pair") return undefined;
  return answer.cells.map((c) => ({ row: c.row, col: c.col }));
}

function getStrongDigits(answer?: MiniBoardResult["answer"]) {
  if (!answer || answer.kind !== "pair") return undefined;
  return answer.cells.map((c) => ({ row: c.row, col: c.col, digits: answer.digits }));
}

export default function DevSudokuPage() {
  const [source, setSource] = useState<BoardSource>("functions");
  const [result, setResult] = useState<{
    initial: Board;
    solution: Board;
    label: string;
    notes?: number[][][];
    answerLabel?: string;
    answer?: MiniBoardResult["answer"];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFull = async (difficulty: Difficulty) => {
    setError(null);
    setLoading(true);
    try {
      if (source === "functions") {
        const { initial, solution } = generateFullBoard(difficulty);
        setResult({
          initial,
          solution,
          label: `Full board (${difficulty}) [functions] — ${countClues(initial)} clues`,
        });
      } else {
        const supabase = createSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from("boards")
          .select("initial_state, solution")
          .eq("board_type", "full")
          .eq("difficulty", difficulty)
          .limit(10);
        if (fetchError) throw new Error(fetchError.message);
        const rows = data ?? [];
        if (rows.length === 0) throw new Error(`No ${difficulty} full boards in database`);
        const board = rows[Math.floor(Math.random() * rows.length)]!;
        const initial = board.initial_state as Board;
        const solution = board.solution as Board;
        setResult({
          initial,
          solution,
          label: `Full board (${difficulty}) [database] — ${countClues(initial)} clues`,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const [miniDifficulty, setMiniDifficulty] = useState<MiniBoardDifficulty>(5);

  const handleMini = async (strategy: Strategy) => {
    setError(null);
    setLoading(true);
    try {
      if (source === "functions") {
        const res = generateMiniBoardByStrategy(strategy, miniDifficulty);
        setResult({
          initial: res.initial,
          solution: res.solution,
          notes: res.initialNotes,
          answer: res.answer,
          answerLabel: getMiniAnswerLabel(res.answer),
          label: `Mini (${strategy}) difficulty ${miniDifficulty}/10 [functions] — ${countClues(res.initial)} clues`,
        });
      } else {
        const supabase = createSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from("boards")
          .select("initial_state, solution")
          .eq("board_type", "mini")
          .eq("strategy_focus", strategy)
          .eq("difficulty_level", miniDifficulty)
          .limit(10);
        if (fetchError) throw new Error(fetchError.message);
        const rows = data ?? [];
        if (rows.length === 0) throw new Error(`No ${strategy} L${miniDifficulty} boards in database`);
        const board = rows[Math.floor(Math.random() * rows.length)]!;
        const initial = board.initial_state as Board;
        const solution = board.solution as Board;
        setResult({
          initial,
          solution,
          label: `Mini (${strategy}) difficulty ${miniDifficulty}/10 [database] — ${countClues(initial)} clues`,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:py-8">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Dev: Sudoku generators
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Development tool to test full board and mini board generation.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">Board source:</span>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setSource("functions")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "functions"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              Functions
            </button>
            <button
              type="button"
              onClick={() => setSource("database")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                source === "database"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              Database
            </button>
          </div>
          {loading && (
            <span className="text-sm text-muted-foreground">Loading…</span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="sr-only">Full board:</span>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleFull(d)}
              disabled={loading}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Full ({d})
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-foreground">
            Mini (strategy-pure, 1–10 difficulty; pairs include pencil marks)
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Difficulty:</span>
            {(Array.from({ length: 10 }, (_, i) => i + 1) as MiniBoardDifficulty[]).map(
              (d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMiniDifficulty(d)}
                  className={`h-8 w-8 rounded text-sm font-medium ${
                    miniDifficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              )
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {STRATEGIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleMini(s)}
                disabled={loading}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Mini: {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-nowrap gap-4">
              <BoardGrid board={result.initial} label={result.label} />
              <BoardGrid board={result.solution} label="Solution" />
            </div>
            {result.notes && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Initial with notes
                </p>
                <StaticBoard
                  board={result.initial}
                  notes={result.notes}
                  pairCells={getPairCells(result.answer)}
                  strongNoteDigits={getStrongDigits(result.answer)}
                />
              </div>
            )}
            {result.answerLabel && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <p className="font-medium text-foreground">Answer</p>
                <p className="mt-1 font-mono text-muted-foreground">{result.answerLabel}</p>
              </div>
            )}
            <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
              <p className="mb-2 text-muted-foreground">Initial (array):</p>
              <pre className="overflow-x-auto whitespace-pre">
                {`[\n${result.initial.map((row) => `  [${row.join(",")}]`).join(",\n")}\n]`}
              </pre>
            </div>
            {result.notes && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
                <p className="mb-2 text-muted-foreground">Initial Notes (array):</p>
                <pre className="overflow-x-auto whitespace-pre">
                  {`[\n${result.notes
                    .map(
                      (row) =>
                        `  [${row.map((cell) => `[${cell.join(",")}]`).join(", ")}]`
                    )
                    .join(",\n")}\n]`}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
