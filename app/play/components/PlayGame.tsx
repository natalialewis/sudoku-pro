"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  type Board,
  type Difficulty,
  type PairHint,
  getAllCandidates,
  detectStrategyUsed,
  findFirstNakedSingle,
  findFirstHiddenSingle,
  findFirstNakedPair,
  findFirstHiddenPair,
  getBoxName,
  getBoxIndex,
  getViolatedConstraint,
  constraintViolationMessage,
  STRATEGY_LABELS,
} from "@/lib/sudoku";
import { fetchRandomFullBoard } from "@/lib/boards";
import type { Strategy } from "@/lib/sudoku/types";
import {
  DigitCaptureInput,
  shouldIgnoreGlobalSudokuDigitKey,
} from "@/components/ui/DigitCaptureInput";

// If the user didn't violate a constraint, but entered a value that is incorrect and there is a strategy that would fill that cell, return a message explaining what strategy to use.
function strategyMessage(value: number, strategy: Strategy): string {
  const name = STRATEGY_LABELS[strategy];
  return `You entered ${value}, but it's incorrect. Use the ${name} strategy to solve this cell.`;
}

function formatUnit(h: PairHint["unit"]): string {
  if (h.type === "row") return `row ${h.index + 1}`;
  if (h.type === "col") return `column ${h.index + 1}`;
  return `the ${getBoxName(h.index)} box`;
}

type HintTarget =
  | {
      kind: "single";
      row: number;
      col: number;
      value: number;
      strategy: "naked_single" | "hidden_single";
    }
  | { kind: "pair"; hint: PairHint };

function boardsMatch(board: Board, solution: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function fireWinConfetti() {
  const colors = ["#9b59b6", "#c4077b"];
  const count = 120;
  const defaults = { origin: { y: 0.6 }, colors };
  confetti({ ...defaults, particleCount: count });
  confetti({ ...defaults, spread: 70, scalar: 0.9 });
  confetti({ ...defaults, spread: 100, scalar: 1.2 });
}

// Main component that renders the game.
interface PlayGameProps {
  isLoggedIn?: boolean;
}

export function PlayGame({ isLoggedIn = false }: PlayGameProps) {
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
  const [highlightPairCells, setHighlightPairCells] = useState<{ row: number; col: number }[] | null>(null);
  const [won, setWon] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const confettiFiredRef = useRef(false);
  const hintTargetRef = useRef<HintTarget | null>(null);
  const digitInputRef = useRef<HTMLInputElement>(null);

  // Record lightweight BKT evidence in play mode for logged-in users.
  const recordPlayObservation = useCallback(
    async (strategy: Strategy, correct: boolean) => {
      if (!isLoggedIn) return;
      try {
        await fetch("/api/bkt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            knowledge_component: strategy,
            correct,
            update_strength: 0.05, // 1/20th of tutor-mode update strength
          }),
        });
      } catch {
        // Ignore network/auth failures so play mode stays responsive for guests.
      }
    },
    [isLoggedIn]
  );

  // Load a puzzle from the database (boards table).
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setBoardError(null);
    setBanner(null);
    setSelectedCell(null);
    setCellError(null);
    setHighlightedBox(null);
    setHighlightPairCells(null);
    setWon(false);
    confettiFiredRef.current = false;
    setUserCandidates({});
    setHintTier(0);
    hintTargetRef.current = null;
    try {
      const { initial: init, solution: sol } = await fetchRandomFullBoard(difficulty);
      setInitial(init.map((r) => [...r]));
      setSolution(sol.map((r) => [...r]));
      setBoard(init.map((r) => [...r]));
    } catch (e) {
      setInitial(null);
      setSolution(null);
      setBoard(null);
      setBoardError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    void startNewGame();
  }, [difficulty, startNewGame]);

  // Detect win: board matches solution.
  useEffect(() => {
    if (!board || !solution || won) return;
    if (boardsMatch(board, solution)) {
      setWon(true);
    }
  }, [board, solution, won]);

  // Fire confetti once when won.
  useEffect(() => {
    if (won && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      fireWinConfetti();
    }
  }, [won]);

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
    digitInputRef.current?.focus();
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
    setHighlightPairCells(null);
    requestAnimationFrame(() => digitInputRef.current?.focus());
  }, [clearWrongCell]);

  // Get a scaffolded hint when the user clicks the hint button.
  const getHint = useCallback(() => {
    if (!board || !solution) return;

    const currentHint = hintTargetRef.current;

    if (currentHint && hintTier >= 1) {
      if (currentHint.kind === "single") {
        if (hintTier === 1) {
          setHintTier(2);
          setBanner({
            message: `There is a ${currentHint.strategy === "naked_single" ? "Naked Single" : "Hidden Single"} in the ${getBoxName(getBoxIndex(currentHint.row, currentHint.col))} box.`,
          });
          return;
        }
        if (hintTier === 2) {
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
          return;
        }
      } else {
        const { hint } = currentHint;
        const pairName =
          hint.strategy === "naked_pair" ? "Naked Pair" : "Hidden Pair";
        if (hintTier === 1) {
          setHintTier(2);
          setHighlightedBox(
            hint.unit.type === "box" ? hint.unit.index : getBoxIndex(hint.cells[0]!.row, hint.cells[0]!.col)
          );
          setBanner({
            message: `There is a ${pairName} in ${formatUnit(hint.unit)} (digits ${hint.digits[0]} and ${hint.digits[1]}).`,
          });
          return;
        }
        if (hintTier === 2) {
          setHighlightPairCells([...hint.cells]);
          setHighlightedBox(null);
          hintTargetRef.current = null;
          setHintTier(0);
          setBanner({
            message: `The two highlighted cells form the ${pairName} on {${hint.digits[0]}, ${hint.digits[1]}}.`,
          });
          return;
        }
      }
    }

    // Find the first naked single on the board. Used to create a hint.
    const naked = findFirstNakedSingle(board);
    if (naked) {
      hintTargetRef.current = { kind: "single", ...naked };
      setHintTier(1);
      setBanner({ message: "Look for a Naked Single." });
      return;
    }

    // Find the first hidden single on the board. Used to create a hint. These come after all naked singles are found.
    const hidden = findFirstHiddenSingle(board);
    if (hidden) {
      hintTargetRef.current = { kind: "single", ...hidden };
      setHintTier(1);
      setBanner({ message: "Look for a Hidden Single." });
      return;
    }

    const np = findFirstNakedPair(board);
    if (np) {
      hintTargetRef.current = { kind: "pair", hint: np };
      setHintTier(1);
      setBanner({ message: "Look for a Naked Pair." });
      return;
    }

    const hp = findFirstHiddenPair(board);
    if (hp) {
      hintTargetRef.current = { kind: "pair", hint: hp };
      setHintTier(1);
      setBanner({ message: "Look for a Hidden Pair." });
      return;
    }

    // If no learned pattern applies, show the user the possible candidates for each empty cell as the bottom out hint.
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
        message:
          "No naked/hidden single or pair found with the current candidates. Showing possible candidates for each empty cell.",
      });
    } else {
      setBanner({ message: "The board is complete!" });
    }
  }, [board, solution, hintTier]);

  const applyDigit = useCallback(
    (digit: number) => {
      if (!board || !solution) return;
      if (banner) return;
      if (digit < 1 || digit > 9) return;
      if (!selectedCell) return;

      const { row, col } = selectedCell;
      if (isLocked(row, col)) return;

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

      const boardBeforeMove = board.map((r) => [...r]);
      boardBeforeMove[row][col] = 0;
      const strategyForCell = detectStrategyUsed(boardBeforeMove, row, col, solution[row][col]);

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
          message: constraintViolationMessage(digit, constraint),
        });
        if (strategyForCell) {
          void recordPlayObservation(strategyForCell, false);
        }
        return;
      }

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
        setHighlightPairCells(null);
        setHighlightedBox(null);
        if (strategyForCell) {
          void recordPlayObservation(strategyForCell, true);
        }
      } else {
        setCellError({ row, col });
        setBoard((prev) => {
          if (!prev) return prev;
          const next = prev.map((r) => [...r]);
          next[row][col] = digit;
          return next;
        });
        if (strategyForCell) {
          void recordPlayObservation(strategyForCell, false);
        }
        if (strategyForCell) {
          setBanner({
            message: strategyMessage(digit, strategyForCell),
          });
        } else {
          setBanner({
            message: `You entered ${digit}, but it's incorrect.`,
          });
        }
      }
    },
    [board, solution, selectedCell, candidatesMode, banner, recordPlayObservation]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!/^[1-9]$/.test(e.key)) return;
      if (shouldIgnoreGlobalSudokuDigitKey(e, digitInputRef.current)) return;
      e.preventDefault();
      applyDigit(parseInt(e.key, 10));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyDigit]);

  // Loading display
  if (loading && !board) {
    return (
      <div className="mt-6 flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading puzzle…</p>
      </div>
    );
  }

  if (boardError && !board) {
    return (
      <div className="mt-6 space-y-3 rounded-lg border border-destructive/50 bg-card p-4">
        <p className="text-sm text-destructive" role="alert">
          {boardError}
        </p>
        <button
          type="button"
          onClick={() => void startNewGame()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!board || !solution || !initial) {
    return null;
  }

  const digitInputDisabled =
    won ||
    !selectedCell ||
    !!banner ||
    isLocked(selectedCell.row, selectedCell.col);

  return (
    <div className="mt-6 space-y-6">
      <DigitCaptureInput ref={digitInputRef} onDigit={applyDigit} disabled={digitInputDisabled} />
      <p className="text-center text-xs text-muted-foreground md:hidden">
        Tap an empty cell to open the number keyboard (answers and notes).
      </p>
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

      <div className="flex justify-center relative">
        <div className="relative inline-block">
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
              const inPairHint =
                highlightPairCells?.some((p) => p.row === r && p.col === c) ?? false;
              const candidates = userCandidates[cellKey(r, c)] ?? [];
              const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
              const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";

              let bg = "bg-card text-foreground";
              if (hasError) bg = "bg-destructive/30 ring-4 ring-destructive ring-inset";
              else if (inPairHint) {
                bg = "bg-purple-500/15 ring-2 ring-purple-600 ring-inset dark:ring-purple-400";
              } else if (inHighlightedBox) bg = "bg-primary-muted/50 ring-2 ring-primary ring-inset";
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
          {won && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <div className="rounded-xl border-2 border-primary bg-card px-8 py-6 text-center shadow-lg">
                <p className="text-2xl font-bold text-primary">You Won!</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click New Game to play again
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
