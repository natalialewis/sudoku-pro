"use client";

import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import type { Board } from "@/lib/sudoku/types";
import {
  checkRowConstraint,
  checkColumnConstraint,
  checkBoxConstraint,
  detectStrategyUsed,
} from "@/lib/sudoku";

type ConstraintType = "row" | "column" | "box";

function getViolatedConstraint(
  board: Board,
  row: number,
  col: number,
  value: number
): ConstraintType | null {
  if (checkRowConstraint(board, row, col, value)) return "row";
  if (checkColumnConstraint(board, row, col, value)) return "column";
  if (checkBoxConstraint(board, row, col, value)) return "box";
  return null;
}

function constraintMessage(value: number, constraint: ConstraintType): string {
  switch (constraint) {
    case "row":
      return `You entered ${value}, but there is already a ${value} in that cell's row.`;
    case "column":
      return `You entered ${value}, but there is already a ${value} in that cell's column.`;
    case "box":
      return `You entered ${value}, but there is already a ${value} in that cell's 3×3 box.`;
    default:
      return `You entered ${value}, but it's incorrect.`;
  }
}

function strategyMessage(
  value: number,
  strategy: "naked_single" | "hidden_single"
): string {
  const name = strategy === "naked_single" ? "Naked Single" : "Hidden Single";
  return `You entered ${value}, but it's incorrect. Use the ${name} strategy to solve this cell.`;
}

function fireCelebrationConfetti() {
  const colors = ["#9b59b6", "#c4077b"];
  const defaults = { origin: { y: 0.6 }, colors, duration: 1200 };
  confetti({ ...defaults, particleCount: 40 });
  confetti({ ...defaults, spread: 50, scalar: 0.8, particleCount: 30 });
}

export function SolveCellQuestion({
  initial,
  answerRow,
  answerCol,
  correctValue,
  strategy,
  onResult,
  onAdvance,
}: {
  initial: Board;
  answerRow: number;
  answerCol: number;
  correctValue: number;
  strategy: "naked_single" | "hidden_single";
  onResult: (correct: boolean) => void;
  onAdvance: () => void;
}) {
  const [board, setBoard] = useState<Board>(() => initial.map((r) => [...r]));
  const [banner, setBanner] = useState<string | null>(null);
  const [resultRecorded, setResultRecorded] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!showCelebration) return;
    const t = setTimeout(() => setShowCelebration(false), 1500);
    return () => clearTimeout(t);
  }, [showCelebration]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (banner) return;
      const digit = /^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : null;
      if (!digit) return;

      e.preventDefault();

      const constraint = getViolatedConstraint(board, answerRow, answerCol, digit);
      if (constraint) {
        setBanner(constraintMessage(digit, constraint));
        setBoard((prev) => {
          const next = prev.map((r) => [...r]);
          next[answerRow][answerCol] = digit;
          return next;
        });
        if (!resultRecorded) {
          setResultRecorded(true);
          onResult(false);
        }
        return;
      }

      if (digit === correctValue) {
        setBoard((prev) => {
          const next = prev.map((r) => [...r]);
          next[answerRow][answerCol] = digit;
          return next;
        });
        setCorrect(true);
        onResult(true);
        setShowCelebration(true);
        fireCelebrationConfetti();
        return;
      }

      const boardBefore = board.map((r) => [...r]);
      boardBefore[answerRow][answerCol] = 0;
      const strat = detectStrategyUsed(boardBefore, answerRow, answerCol, correctValue);
      setBoard((prev) => {
        const next = prev.map((r) => [...r]);
        next[answerRow][answerCol] = digit;
        return next;
      });
      if (strat === "naked_single" || strat === "hidden_single") {
        setBanner(strategyMessage(digit, strat));
      } else {
        setBanner(`You entered ${digit}, but it's incorrect.`);
      }
      if (!resultRecorded) {
        setResultRecorded(true);
        onResult(false);
      }
    },
    [board, answerRow, answerCol, correctValue, strategy, banner, resultRecorded, onResult]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative space-y-4">
      {showCelebration && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="rounded-xl border-2 border-primary bg-card px-8 py-6 text-center shadow-lg">
            <p id="celebration-title" className="text-2xl font-bold text-primary">
              Great job!
            </p>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Fill in the highlighted cell. Type a number 1–9.
      </p>
      <div className="flex justify-center">
        <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isTarget = r === answerRow && c === answerCol;
              const hasError = isTarget && banner && board[r][c] !== 0 && board[r][c] !== correctValue;
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";
              let bg = "bg-card text-foreground";
              if (hasError) bg = "bg-destructive/30 ring-4 ring-destructive ring-inset";
              else if (isTarget) bg = "bg-primary/25 ring-2 ring-primary ring-inset";

              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center border-border text-sm tabular-nums ${borderRight} ${borderBottom} ${bg} ${
                    isTarget ? "font-semibold" : ""
                  } ${isTarget ? "" : "cursor-default"}`}
                >
                  {val === 0 ? "" : val}
                </div>
              );
            })
          )}
        </div>
      </div>
      {banner && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground">{banner}</p>
          <button
            type="button"
            onClick={() => {
              setBanner(null);
              setBoard((prev) => {
                const next = prev.map((r) => [...r]);
                next[answerRow][answerCol] = 0;
                return next;
              });
            }}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAdvance}
          disabled={!correct}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
