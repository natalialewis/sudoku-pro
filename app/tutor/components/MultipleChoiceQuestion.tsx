"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { Board } from "@/lib/sudoku/types";

function fireCelebrationConfetti() {
  const colors = ["#9b59b6", "#c4077b"];
  const defaults = { origin: { y: 0.6 }, colors, duration: 1200 };
  confetti({ ...defaults, particleCount: 40 });
  confetti({ ...defaults, spread: 50, scalar: 0.8, particleCount: 30 });
}

const STRATEGY_OPTIONS: { value: "naked_single" | "hidden_single"; label: string }[] = [
  { value: "naked_single", label: "Naked Single" },
  { value: "hidden_single", label: "Hidden Single" },
];

export function MultipleChoiceQuestion({
  board,
  answerRow,
  answerCol,
  correctStrategy,
  onResult,
  onAdvance,
}: {
  board: Board;
  answerRow: number;
  answerCol: number;
  correctStrategy: "naked_single" | "hidden_single";
  onResult: (correct: boolean) => void;
  onAdvance: () => void;
}) {
  const [selected, setSelected] = useState<"naked_single" | "hidden_single" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!showCelebration) return;
    const t = setTimeout(() => setShowCelebration(false), 1500);
    return () => clearTimeout(t);
  }, [showCelebration]);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === correctStrategy;
    onResult(correct);
    if (correct) {
      setShowCelebration(true);
      fireCelebrationConfetti();
    }
  };

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
        Which strategy can you use to find the value in the highlighted cell?
      </p>
      <div className="flex justify-center">
        <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isTarget = r === answerRow && c === answerCol;
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";
              const bg = isTarget ? "bg-primary/25 ring-2 ring-primary ring-inset" : "bg-card text-foreground";

              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center border-border text-sm tabular-nums ${borderRight} ${borderBottom} ${bg}`}
                >
                  {val === 0 ? "" : val}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="space-y-2">
        {STRATEGY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => !submitted && setSelected(opt.value)}
            disabled={submitted}
            className={`block w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selected === opt.value
                ? "border-primary bg-primary-muted text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            } ${submitted ? "opacity-80" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected === null}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Submit
        </button>
      ) : (
        <div className="space-y-2">
          {selected !== correctStrategy && (
            <p className="text-sm text-muted-foreground">
              Not quite. The correct strategy is {STRATEGY_OPTIONS.find((o) => o.value === correctStrategy)?.label}.
            </p>
          )}
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
