"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  type Board,
  type Difficulty,
  generateFullBoard,
  checkRowConstraint,
  checkColumnConstraint,
  checkBoxConstraint,
  getAllCandidates,
  detectStrategyUsed,
  findFirstNakedSingle,
  findFirstHiddenSingle,
  getBoxName,
  getBoxIndex,
} from "@/lib/sudoku";

type ConstraintType = "row" | "column" | "box";

// If the user enters a value that violates a constraint (Sudoku rule), return the type of constraint violated.
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

// If the user enters a value that violates a constraint (Sudoku rule), return a message explaining the constraint violation.
function constraintMessage(
  value: number,
  constraint: ConstraintType,
  row: number,
  col: number
): string {
  const humanRow = row + 1;
  const humanCol = col + 1;
  switch (constraint) {
    case "row":
      return `You entered ${value}, but there is already a ${value} in that cell's row.`;
    case "column":
      return `You entered ${value}, but there is already a ${value} in that cell's column.`;
    case "box":
      return `You entered ${value}, but there is already a ${value} in that cell's 3×3 box.`;
    // They essentially guessed.
    default:
      return `You entered ${value}, but it's incorrect. Try looking for strategies and minimize guessing.`;
  }
}

// If the user didn't violate a constraint, but entered a value that is incorrect and there is a strategy that would fill that cell, return a message explaining what strategy to use.
function strategyMessage(value: number, strategy: "naked_single" | "hidden_single"): string {
  const name = strategy === "naked_single" ? "Naked Single" : "Hidden Single";
  return `You entered ${value}, but it's incorrect. Use the ${name} strategy to solve this cell.`;
}

// Main component that renders the game.
export function PlayGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initial, setInitial] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [cellError, setCellError] = useState<{ row: number; col: number } | null>(null);
  const [candidatesMode, setCandidatesMode] = useState(false);
  const [userCandidates, setUserCandidates] = useState<Record<string, number[]>>({});
  const [banner, setBanner] = useState<{ message: string } | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [highlightedBox, setHighlightedBox] = useState<number | null>(null);
  const hintTargetRef = useRef<{ row: number; col: number; value: number; strategy: "naked_single" | "hidden_single" } | null>(null);

  // Start a new game. Set all states to the initial values and generate a new puzzle.
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    setSelectedCell(null);
    setCellError(null);
    setHighlightedBox(null);
    setUserCandidates({});
    setHintTier(0);
    hintTargetRef.current = null;
    try {
      const { initial: init, solution: sol } = generateFullBoard(difficulty);
      setInitial(init.map((r) => [...r]));
      setSolution(sol.map((r) => [...r]));
      setBoard(init.map((r) => [...r]));
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, []);

  // Helper functions to make the code more readable.
  const cellKey = (r: number, c: number) => `${r},${c}`;
  const isGiven = (r: number, c: number) =>
    initial != null && initial[r]?.[c] !== 0;
  const isLocked = (r: number, c: number) =>
    isGiven(r, c) ||
    (board != null && solution != null && board[r]?.[c] !== 0 && board[r][c] === solution[r][c]);
  const isEmpty = (r: number, c: number) =>
    board != null && board[r]?.[c] === 0;

  // Handle cell click.
  const handleCellClick = (r: number, c: number) => {
    if (!board || isLocked(r, c)) return;
    setSelectedCell({ row: r, col: c });
    setCellError(null);
  };

  // Clear the wrong cell when the user dismisses the banner.
  const clearWrongCell = useCallback(() => {
    if (!board || !selectedCell) return;
    const { row, col } = selectedCell;
    if (board[row][col] !== 0 && solution && board[row][col] !== solution[row][col]) {
      setBoard((prev) => {
        if (!prev) return prev;
        const next = prev.map((row) => [...row]);
        next[row][col] = 0;
        return next;
      });
    }
    setCellError(null);
  }, [board, solution, selectedCell]);

  const dismissBanner = useCallback(() => {
    clearWrongCell();
    setBanner(null);
    setHighlightedBox(null);
  }, [clearWrongCell]);

  // Get a scaffolded hint when the user clicks the hint button.
  const getHint = useCallback(() => {
    if (!board || !solution) return;

    const currentHint = hintTargetRef.current;

    if (currentHint && hintTier < 3) {
      setHintTier((t) => t + 1);
      if (hintTier === 1) {
        setBanner({
          message: `There is a ${currentHint.strategy === "naked_single" ? "Naked Single" : "Hidden Single"} in the ${getBoxName(getBoxIndex(currentHint.row, currentHint.col))} box.`,
        });
      } else if (hintTier === 2) {
        setBoard((prev) => {
          if (!prev) return prev;
          const next = prev.map((row) => [...row]);
          next[currentHint.row][currentHint.col] = currentHint.value;
          return next;
        });
        setUserCandidates((prev) => {
          const key = cellKey(currentHint.row, currentHint.col);
          const { [key]: _, ...rest } = prev;
          return rest;
        });
        hintTargetRef.current = null;
        setHintTier(0);
        setSelectedCell({ row: currentHint.row, col: currentHint.col });
        setHighlightedBox(getBoxIndex(currentHint.row, currentHint.col));
        setBanner({
          message: `The ${currentHint.value} is a ${currentHint.strategy === "naked_single" ? "Naked Single" : "Hidden Single"}.`,
        });
      }
      return;
    }

    // Find the first naked single on the board. Used to create a hint.
    const naked = findFirstNakedSingle(board);
    if (naked) {
      hintTargetRef.current = naked;
      setHintTier(1);
      setBanner({ message: "Look for a Naked Single." });
      return;
    }

    // Find the first hidden single on the board. Used to create a hint. These come after all naked singles are found.
    const hidden = findFirstHiddenSingle(board);
    if (hidden) {
      hintTargetRef.current = hidden;
      setHintTier(1);
      setBanner({ message: "Look for a Hidden Single." });
      return;
    }

    // If no naked or hidden singles are found, show the user the possible candidates for each empty cell as the bottom out hint.
    const allCandidates = getAllCandidates(board);
    if (allCandidates.length > 0) {
      setUserCandidates((prev) => {
        const next: Record<string, number[]> = {};
        for (const { row, col, candidates } of allCandidates) {
          const key = cellKey(row, col);
          const existing = prev[key] ?? [];
          next[key] = existing.filter((c) => candidates.includes(c)).length > 0
            ? existing.filter((c) => candidates.includes(c))
            : candidates;
        }
        return next;
      });
      setBanner({
        message: "None of the learned strategies apply. Showing possible candidates for each empty cell.",
      });
    } else {
      setBanner({ message: "The board is complete!" });
    }
  }, [board, solution, hintTier]);

  // If the user presses a digit key, enter the digit into the selected cell.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!board || !solution) return;
      if (banner) return;

      // Must be between 1 and 9.
      const digit = /^[1-9]$/.test(e.key) ? parseInt(e.key, 10) : null;
      if (!digit || !selectedCell) return;

      const { row, col } = selectedCell;
      if (isLocked(row, col)) return;

      e.preventDefault();

      // If the user is in candidates mode, add the digit to the user's candidates for the selected cell. (Notes)
      if (candidatesMode) {
        setUserCandidates((prev) => {
          const key = cellKey(row, col);
          const current = prev[key] ?? [];
          const has = current.includes(digit);
          const next = has
            ? current.filter((d) => d !== digit)
            : [...current, digit].sort((a, b) => a - b);
          return { ...prev, [key]: next };
        });
        return;
      }

      // If the user entered a value that violates a constraint (Sudoku rule), show a banner explaining the constraint violation.
      const constraint = getViolatedConstraint(board, row, col, digit);
      if (constraint) {
        setCellError({ row, col });
        setBoard((prev) => {
          if (!prev) return prev;
          const next = prev.map((r) => [...r]);
          next[row][col] = digit;
          return next;
        });
        setBanner({
          message: constraintMessage(digit, constraint, row, col),
        });
        return;
      }

      // If the user entered the correct value, set the cell to the correct value and clear the banner. Else, show a banner explaining the incorrect value.
      const correct = solution[row][col];
      if (digit === correct) {
        setBoard((prev) => {
          if (!prev) return prev;
          const next = prev.map((r) => [...r]);
          next[row][col] = digit;
          return next;
        });
        setUserCandidates((prev) => {
          const key = cellKey(row, col);
          const { [key]: _, ...rest } = prev;
          return rest;
        });
        setHintTier(0);
        hintTargetRef.current = null;
      } else {
        setCellError({ row, col });
        setBoard((prev) => {
          if (!prev) return prev;
          const next = prev.map((r) => [...r]);
          next[row][col] = digit;
          return next;
        });
        const boardBeforeMove = board.map((r) => [...r]);
        boardBeforeMove[row][col] = 0;
        const strategy = detectStrategyUsed(boardBeforeMove, row, col, correct);
        if (strategy === "naked_single" || strategy === "hidden_single") {
          setBanner({
            message: strategyMessage(digit, strategy),
          });
        } else {
          setBanner({
            message: `You entered ${digit}, but it's incorrect.`,
          });
        }
      }
    },
    [board, solution, selectedCell, candidatesMode, banner]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Loading display
  if (loading && !board) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <p className="text-muted-foreground">Generating puzzle…</p>
      </div>
    );
  }

  if (!board || !solution || !initial) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-medium text-foreground">Difficulty:</span>
        <div className="flex rounded-lg border border-border p-0.5">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                difficulty === d ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={startNewGame}
          disabled={loading}
          className="rounded-lg border-2 border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
        >
          New Game
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={getHint}
          disabled={!!banner}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Hint
        </button>
        <button
          type="button"
          onClick={() => setCandidatesMode((m) => !m)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            candidatesMode
              ? "border-primary bg-primary-muted text-primary"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {candidatesMode ? "Enter Answers" : "Enter Notes"}
        </button>
      </div>

      {banner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <p id="banner-title" className="text-foreground">
              {banner.message}
            </p>
            <button
              type="button"
              onClick={dismissBanner}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
          {board.map((row, r) =>
            row.map((val, c) => {
              const locked = isLocked(r, c);
              const userFilled = locked && !isGiven(r, c);
              const selected =
                selectedCell?.row === r && selectedCell?.col === c;
              const hasError = cellError?.row === r && cellError?.col === c;
              const inHighlightedBox =
                highlightedBox != null &&
                getBoxIndex(r, c) === highlightedBox;
              const candidates = userCandidates[cellKey(r, c)] ?? [];
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";

              let bg = "bg-card text-foreground";
              if (hasError) bg = "bg-destructive/30 ring-4 ring-destructive ring-inset";
              else if (inHighlightedBox) bg = "bg-primary-muted/50 ring-2 ring-primary ring-inset";
              else if (selected) bg = "bg-primary/25 ring-2 ring-primary ring-inset";

              const textColor = userFilled ? "text-primary" : "";

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  disabled={locked}
                  className={`flex h-10 w-10 min-h-10 min-w-10 items-center justify-center border-border text-sm tabular-nums ${borderRight} ${borderBottom} ${bg} ${textColor} ${
                    locked ? "cursor-default font-semibold" : "cursor-pointer hover:bg-muted"
                  }`}
                >
                  {val !== 0 ? (
                    val
                  ) : candidates.length > 0 ? (
                    <span className="grid grid-cols-3 grid-rows-3 w-full h-full place-items-center text-[9px] text-muted-foreground p-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n}>{candidates.includes(n) ? n : "\u00A0"}</span>
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
