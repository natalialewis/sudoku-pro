"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { Board, Strategy } from "@/lib/sudoku/types";
import type { NotesGrid } from "@/components/ui/StaticBoard";

function fireCelebrationConfetti() {
  const colors = ["#9b59b6", "#c4077b"];
  const defaults = { origin: { y: 0.6 }, colors, duration: 1200 };
  confetti({ ...defaults, particleCount: 40 });
  confetti({ ...defaults, spread: 50, scalar: 0.8, particleCount: 30 });
}

export const SINGLE_STRATEGY_OPTIONS: { value: Strategy; label: string }[] = [
  { value: "naked_single", label: "Naked Single" },
  { value: "hidden_single", label: "Hidden Single" },
];

export const PAIR_STRATEGY_OPTIONS: { value: Strategy; label: string }[] = [
  { value: "naked_pair", label: "Naked Pair" },
  { value: "hidden_pair", label: "Hidden Pair" },
];

export function MultipleChoiceQuestion({
  board,
  notes,
  pairCells,
  strongPairDigits,
  answerRow,
  answerCol,
  options,
  correctStrategy,
  onResult,
  onAdvance,
}: {
  board: Board;
  notes?: NotesGrid;
  pairCells?: { row: number; col: number }[];
  /** Highlight pair digits in purple inside notes (pair questions). */
  strongPairDigits?: { row: number; col: number; digits: number[] }[];
  answerRow?: number;
  answerCol?: number;
  options: { value: Strategy; label: string }[];
  correctStrategy: Strategy;
  onResult: (correct: boolean) => void;
  onAdvance: () => void;
}) {
  const [selected, setSelected] = useState<Strategy | null>(null);
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

  const strongSet = new Set(
    (strongPairDigits ?? []).flatMap((e) => e.digits.map((d) => `${e.row}-${e.col}-${d}`))
  );

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
        {pairCells && pairCells.length > 0
          ? "Which strategy identifies the pair highlighted on the board?"
          : "Which strategy can you use to find the value in the highlighted cell?"}
      </p>
      <div className="flex justify-center">
        <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
          {board.map((row, r) =>
            row.map((val, c) => {
              const isSingleTarget =
                answerRow != null && answerCol != null && r === answerRow && c === answerCol;
              const isPairRing = pairCells?.some((p) => p.row === r && p.col === c);
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";
              let bg = "bg-card text-foreground";
              if (isSingleTarget) bg = "bg-primary/25 ring-2 ring-primary ring-inset";
              else if (isPairRing) bg = "bg-purple-500/10 ring-2 ring-purple-600 ring-inset dark:ring-purple-400";

              const noteList = notes?.[r]?.[c];
              const showNotes =
                val === 0 && noteList != null && noteList.length > 0;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center border-border text-sm tabular-nums ${borderRight} ${borderBottom} ${bg}`}
                >
                  {showNotes ? (
                    <span className="grid grid-cols-3 grid-rows-3 h-full w-full place-items-center text-[9px] text-muted-foreground p-0.5 leading-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                        const on = noteList.includes(n);
                        const strong = strongSet.has(`${r}-${c}-${n}`);
                        return (
                          <span
                            key={n}
                            className={
                              strong
                                ? "font-semibold text-purple-600 dark:text-purple-400"
                                : ""
                            }
                          >
                            {on ? n : "\u00A0"}
                          </span>
                        );
                      })}
                    </span>
                  ) : val === 0 ? (
                    ""
                  ) : (
                    val
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="space-y-2">
        {options.map((opt) => (
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
              Not quite. The correct strategy is {options.find((o) => o.value === correctStrategy)?.label}.
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
