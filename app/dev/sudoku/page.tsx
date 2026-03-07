"use client";

import { useState } from "react";
import {
  generateFullBoard,
  generateMiniBoardByStrategy,
  type Board,
  type Strategy,
  STRATEGIES,
  type Difficulty,
  type MiniBoardDifficulty,
} from "@/lib/sudoku";

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

// Main page component
export default function DevSudokuPage() {
  const [result, setResult] = useState<{
    initial: Board;
    solution: Board;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFull = (difficulty: Difficulty) => {
    setError(null);
    try {
      const { initial, solution } = generateFullBoard(difficulty);
      setResult({
        initial,
        solution,
        label: `Full board (${difficulty}) — ${countClues(initial)} clues`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const [miniDifficulty, setMiniDifficulty] = useState<MiniBoardDifficulty>(5);

  const handleMini = (strategy: Strategy) => {
    setError(null);
    try {
      const res = generateMiniBoardByStrategy(strategy, miniDifficulty);
      const solution = res.initial.map((row) => [...row]);
      solution[res.answer.row][res.answer.col] = res.answer.value;
      setResult({
        initial: res.initial,
        solution,
        label: `Mini (${strategy}) difficulty ${miniDifficulty}/10 — ${countClues(res.initial)} clues`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="sr-only">Full board:</span>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleFull(d)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Full ({d})
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-foreground">
            Mini (strategy-pure, 1–10 difficulty for naked/hidden single)
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
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
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
            <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs">
              <p className="mb-2 text-muted-foreground">Initial (array):</p>
              <pre className="overflow-x-auto whitespace-pre">
                {`[\n${result.initial.map((row) => `  [${row.join(",")}]`).join(",\n")}\n]`}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
