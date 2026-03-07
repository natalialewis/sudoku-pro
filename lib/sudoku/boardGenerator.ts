import type { Board } from "./types";
import { BOARD_SIZE, BOX_SIZE } from "./types";
import { hasUniqueSolution } from "./solver";

/**
 * Shuffle array in place (Fisher–Yates).
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Create a random complete valid Sudoku grid by backtracking with random digit order.
 */
function generateSolvedBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffle(digits);

  // Recursive function to fill the board
  function fill(r: number, c: number): boolean {
    if (r === BOARD_SIZE) return true;
    const nextC = c + 1;
    const nextR = nextC === BOARD_SIZE ? r + 1 : r;
    const nextCol = nextC === BOARD_SIZE ? 0 : nextC;

    // If the cell is already filled, move to the next cell
    if (board[r][c] !== 0) return fill(nextR, nextCol);
    shuffle(digits);
    // Try each digit in random order
    for (const value of digits) {
      if (!isValid(board, r, c, value)) continue;
      board[r][c] = value;
      if (fill(nextR, nextCol)) return true;
      board[r][c] = 0;
    }
    return false;
  }

  // Check if the value is valid in the cell
  function isValid(b: Board, row: number, col: number, value: number): boolean {
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (b[row][i] === value || b[i][col] === value) return false;
    }
    const sr = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const sc = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = sr; r < sr + BOX_SIZE; r++) {
      for (let c = sc; c < sc + BOX_SIZE; c++) {
        if (b[r][c] === value) return false;
      }
    }
    return true;
  }

  fill(0, 0);
  return board;
}

/**
 * Remove `countToRemove` clues from a solved board. Returns a new board (puzzle).
 * Does not guarantee unique solution; use removeCluesWithUniqueness for that.
 */
export function removeClues(
  solvedBoard: Board,
  countToRemove: number
): Board {
  const board = solvedBoard.map((row) => [...row]);
  const cells: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) cells.push([r, c]);
  }
  shuffle(cells);
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= countToRemove) break;
    const prev = board[r][c];
    board[r][c] = 0;
    removed++;
  }
  return board;
}

/**
 * Remove clues one at a time at random, ensuring the puzzle keeps a unique solution.
 * Returns puzzle with (81 - targetCluesToRemove) clues.
 */
function removeCluesWithUniqueness(
  solvedBoard: Board,
  targetCluesToRemove: number
): Board {
  const board = solvedBoard.map((row) => [...row]);
  const cells: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) cells.push([r, c]);
  }
  shuffle(cells);
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= targetCluesToRemove) break;
    const prev = board[r][c];
    board[r][c] = 0;
    if (hasUniqueSolution(board)) {
      removed++;
    } else {
      board[r][c] = prev;
    }
  }
  return board;
}

export type Difficulty = "easy" | "medium" | "hard";

/** Approximate clues to keep per difficulty (plan: easy ~35, medium ~28, hard ~22). */
const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 35,
  medium: 28,
  hard: 22,
};

/**
 * Generate a complete solvable Sudoku puzzle for the given difficulty.
 * Returns { initial_state, solution } as boards (0 = empty).
 */
export function generateFullBoard(difficulty: Difficulty): {
  initial: Board;
  solution: Board;
} {
  const solution = generateSolvedBoard();
  const cluesToKeep = CLUES_BY_DIFFICULTY[difficulty];
  const toRemove = 81 - cluesToKeep;
  const initial = removeCluesWithUniqueness(solution, toRemove);
  return { initial, solution };
}

/**
 * Validate that the board has exactly one solution.
 */
export function validateBoard(board: Board): boolean {
  return hasUniqueSolution(board);
}
