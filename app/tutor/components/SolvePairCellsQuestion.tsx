"use client";

import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import type { Board } from "@/lib/sudoku/types";
import type { NotesGrid } from "@/components/ui/StaticBoard";

function fireCelebrationConfetti() {
  const colors = ["#9b59b6", "#c4077b"];
  const defaults = { origin: { y: 0.6 }, colors, duration: 1200 };
  confetti({ ...defaults, particleCount: 40 });
  confetti({ ...defaults, spread: 50, scalar: 0.8, particleCount: 30 });
}

function cellKey(r: number, c: number) {
  return `${r}-${c}`;
}

/** Compare two unordered cell pairs. */
export function pairCellsMatch(
  selected: { row: number; col: number }[],
  expected: [{ row: number; col: number }, { row: number; col: number }]
): boolean {
  if (selected.length !== 2) return false;
  const s = [...selected].sort((x, y) => x.row - y.row || x.col - y.col);
  const e = [...expected].sort((x, y) => x.row - y.row || x.col - y.col);
  return s[0]!.row === e[0]!.row && s[0]!.col === e[0]!.col && s[1]!.row === e[1]!.row && s[1]!.col === e[1]!.col;
}

export function SolvePairCellsQuestion({
  initial,
  notes,
  answerCells,
  strategyLabel,
  onResult,
  onAdvance,
}: {
  initial: Board;
  notes: NotesGrid;
  answerCells: [{ row: number; col: number }, { row: number; col: number }];
  strategyLabel: string;
  onResult: (correct: boolean) => void;
  onAdvance: () => void;
}) {
  const [selected, setSelected] = useState<{ row: number; col: number }[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [resultRecorded, setResultRecorded] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!showCelebration) return;
    const t = setTimeout(() => setShowCelebration(false), 1500);
    return () => clearTimeout(t);
  }, [showCelebration]);

  const toggleCell = useCallback(
    (r: number, c: number) => {
      if (banner || initial[r][c] !== 0) return;
      setSelected((prev) => {
        const idx = prev.findIndex((p) => p.row === r && p.col === c);
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        if (prev.length >= 2) return [prev[1]!, { row: r, col: c }];
        return [...prev, { row: r, col: c }];
      });
    },
    [banner, initial]
  );

  const handleSubmit = useCallback(() => {
    if (selected.length !== 2) return;
    const ok = pairCellsMatch(selected, answerCells);
    if (!resultRecorded) {
      onResult(ok);
      setResultRecorded(true);
    }
    if (ok) {
      setCorrect(true);
      setBanner(null);
      setShowCelebration(true);
      fireCelebrationConfetti();
    } else {
      setBanner(
        `Not quite. Use ${strategyLabel} to find the two cells that form the pair (click two empty cells, then check again).`
      );
    }
  }, [selected, answerCells, strategyLabel, resultRecorded, onResult]);

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
        Click the two empty cells that form the {strategyLabel.toLowerCase()}. Selected:{" "}
        {selected.length}/2
      </p>
      <div className="flex justify-center">
        <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
          {initial.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selected.some((p) => p.row === r && p.col === c);
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";
              const noteList = notes[r]?.[c];
              const showNotes = val === 0 && noteList != null && noteList.length > 0;
              const empty = val === 0;
              const canClick = empty && !banner;

              let bg = "bg-card text-foreground";
              if (isSelected) bg = "bg-purple-500/15 ring-2 ring-purple-600 ring-inset dark:ring-purple-400";

              return (
                <button
                  key={cellKey(r, c)}
                  type="button"
                  disabled={!canClick}
                  onClick={() => toggleCell(r, c)}
                  className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center border-border text-sm tabular-nums ${borderRight} ${borderBottom} ${bg} ${
                    canClick ? "cursor-pointer hover:bg-muted" : "cursor-default"
                  }`}
                >
                  {showNotes ? (
                    <span className="grid grid-cols-3 grid-rows-3 h-full w-full place-items-center text-[9px] text-muted-foreground p-0.5 leading-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n}>{noteList!.includes(n) ? n : "\u00A0"}</span>
                      ))}
                    </span>
                  ) : val === 0 ? (
                    ""
                  ) : (
                    val
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      {!correct && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length !== 2 || !!banner}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            disabled={!!banner}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Clear selection
          </button>
        </div>
      )}
      {banner && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground">{banner}</p>
          <button
            type="button"
            onClick={() => {
              setBanner(null);
              setSelected([]);
              setResultRecorded(false);
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
