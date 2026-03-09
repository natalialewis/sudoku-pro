"use client";

import type { Strategy } from "@/lib/sudoku/types";

const INTRO_CONTENT: Record<
  Strategy,
  { title: string; what: string; spot: string }
> = {
  naked_single: {
    title: "Naked Single",
    what:
      "A naked single is a cell that has only one possible value. Every other digit (1–9) already appears in that cell's row, column, or 3×3 box, so the only option left is the remaining digit.",
    spot:
      "Look at each empty cell and ask: which digits can go here? If eight different digits are already placed in its row, column, and box, the cell must be the remaining one.",
  },
  hidden_single: {
    title: "Hidden Single",
    what:
      "A hidden single is when a digit can only go in one cell within a row, column, or 3×3 box. You find it by picking a digit and asking: where can this digit go in this unit?",
    spot:
      "Pick a digit (1–9) and scan one row, column, or box. Eliminate cells where that digit is blocked. If only one empty cell remains for that digit, you've found a hidden single.",
  },
  naked_pair: {
    title: "Naked Pair",
    what: "Coming soon.",
    spot: "",
  },
  hidden_pair: {
    title: "Hidden Pair",
    what: "Coming soon.",
    spot: "",
  },
};

export function IntroSlide({
  strategy,
  onNext,
}: {
  strategy: Strategy;
  onNext: () => void;
}) {
  const content = INTRO_CONTENT[strategy];
  if (!content || !content.spot) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">{content.title}</h2>
      <section className="mt-4">
        <h3 className="text-sm font-medium text-foreground">What it is</h3>
        <p className="mt-1 text-sm text-muted-foreground">{content.what}</p>
      </section>
      <section className="mt-4">
        <h3 className="text-sm font-medium text-foreground">How to spot it</h3>
        <p className="mt-1 text-sm text-muted-foreground">{content.spot}</p>
      </section>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Next
        </button>
      </div>
    </div>
  );
}
