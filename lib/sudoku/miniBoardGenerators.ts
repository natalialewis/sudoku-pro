import type { Board } from "./types";
import type { Strategy } from "./types";
import { BOARD_SIZE, BOX_SIZE } from "./types";
import { getBoxIndex, isValidMove } from "./constraints";

export type MiniBoardDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface MiniBoardResult {
  initial: Board;
  answer: { row: number; col: number; value: number };
}

const MAX_GENERATOR_ATTEMPTS = 100;

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function getBoxCells(boxIndex: number): [number, number][] {
  const startR = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const startC = (boxIndex % BOX_SIZE) * BOX_SIZE;
  const out: [number, number][] = [];
  for (let r = startR; r < startR + BOX_SIZE; r++) {
    for (let c = startC; c < startC + BOX_SIZE; c++) out.push([r, c]);
  }
  return out;
}

function getRowCells(row: number): [number, number][] {
  return Array.from({ length: BOARD_SIZE }, (_, c) => [row, c]);
}

function getColCells(col: number): [number, number][] {
  return Array.from({ length: BOARD_SIZE }, (_, r) => [r, col]);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function canPlace(board: Board, row: number, col: number, value: number): boolean {
  return isValidMove(board, row, col, value);
}

function generateSolvedGrid(): Board {
  const board = createEmptyBoard();
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  function fill(r: number, c: number): boolean {
    if (r === BOARD_SIZE) return true;
    const nextC = c + 1;
    const nextR = nextC === BOARD_SIZE ? r + 1 : r;
    const nextCol = nextC === BOARD_SIZE ? 0 : nextC;
    if (board[r][c] !== 0) return fill(nextR, nextCol);
    shuffle(digits);
    for (const value of digits) {
      if (!canPlace(board, r, c, value)) continue;
      board[r][c] = value;
      if (fill(nextR, nextCol)) return true;
      board[r][c] = 0;
    }
    return false;
  }
  fill(0, 0);
  return board;
}

// ---------------------------------------------------------------------------
// 1. Hidden Single Generator (strict top-down, box-only)
// ---------------------------------------------------------------------------

/**
 * Hidden Single (strict): digit D can only go in the target cell in the 3x3 box,
 * but the target cell must NOT be a Naked Single — it has 3–4 candidates so the
 * user must use region logic. Region is always a 3x3 box.
 */
export function generateHiddenSingleBoard(difficulty: MiniBoardDifficulty): MiniBoardResult {
  const solved = generateSolvedGrid();
  const boxIndex = Math.floor(Math.random() * 9);
  const blockCells = getBoxCells(boxIndex);
  const target = pickRandom(blockCells);
  const [tR, tC] = target;
  const D = solved[tR][tC];

  const startR = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const startC = (boxIndex % BOX_SIZE) * BOX_SIZE;

  let numEmpty: number;
  if (difficulty <= 3) numEmpty = 2 + Math.floor(Math.random() * 2);
  else if (difficulty <= 7) numEmpty = 4 + Math.floor(Math.random() * 3);
  else numEmpty = 7 + Math.floor(Math.random() * 2);
  numEmpty = Math.min(numEmpty, 9);

  const emptyInBox = new Set<string>();
  emptyInBox.add(`${tR},${tC}`);
  const others = blockCells.filter(([r, c]) => r !== tR || c !== tC);
  shuffle(others);
  for (let i = 0; i < numEmpty - 1 && i < others.length; i++) {
    emptyInBox.add(`${others[i][0]},${others[i][1]}`);
  }

  const toReveal = new Set<string>();
  for (const [r, c] of blockCells) {
    if (emptyInBox.has(`${r},${c}`)) continue;
    toReveal.add(`${r},${c}`);
  }

  for (const key of emptyInBox) {
    if (key === `${tR},${tC}`) continue;
    const [r, c] = key.split(",").map(Number);
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (col >= startC && col < startC + BOX_SIZE) continue;
      if (solved[r][col] === D) {
        toReveal.add(`${r},${col}`);
        break;
      }
    }
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (row >= startR && row < startR + BOX_SIZE) continue;
      if (solved[row][c] === D) {
        toReveal.add(`${row},${c}`);
        break;
      }
    }
  }

  let numDistractors: number;
  if (difficulty <= 3) numDistractors = Math.floor(Math.random() * 6);
  else if (difficulty <= 7) numDistractors = 10 + Math.floor(Math.random() * 6);
  else numDistractors = 20 + Math.floor(Math.random() * 11);

  const distractorPool: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getBoxIndex(r, c) === boxIndex) continue;
      if (solved[r][c] === D) continue;
      if (toReveal.has(`${r},${c}`)) continue;
      distractorPool.push([r, c]);
    }
  }
  shuffle(distractorPool);
  numDistractors = Math.min(numDistractors, distractorPool.length);
  for (let i = 0; i < numDistractors; i++) {
    toReveal.add(`${distractorPool[i][0]},${distractorPool[i][1]}`);
  }

  const digitsVisibleOutsideBox = new Set<number>();
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (getBoxIndex(tR, col) === boxIndex) continue;
    digitsVisibleOutsideBox.add(solved[tR][col]);
  }
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (getBoxIndex(row, tC) === boxIndex) continue;
    digitsVisibleOutsideBox.add(solved[row][tC]);
  }
  digitsVisibleOutsideBox.delete(D);
  const hideable = [...digitsVisibleOutsideBox];
  shuffle(hideable);
  const numToHide = Math.min(2 + Math.floor(Math.random() * 2), hideable.length);
  const digitsToHide = new Set(hideable.slice(0, numToHide));

  const inTargetRowOrColOutsideBox = (r: number, c: number): boolean =>
    (r === tR || c === tC) && getBoxIndex(r, c) !== boxIndex;

  for (const key of [...toReveal]) {
    const [r, c] = key.split(",").map(Number);
    if (!inTargetRowOrColOutsideBox(r, c)) continue;
    if (digitsToHide.has(solved[r][c])) toReveal.delete(key);
  }

  const initial = createEmptyBoard();
  for (const key of toReveal) {
    const [r, c] = key.split(",").map(Number);
    initial[r][c] = solved[r][c];
  }
  initial[tR][tC] = 0;

  return {
    initial: initial.map((row) => [...row]),
    answer: { row: tR, col: tC, value: D },
  };
}

// ---------------------------------------------------------------------------
// 2. Naked Single Generator (top-down masking)
// ---------------------------------------------------------------------------

function manhattan(r: number, c: number, tr: number, tc: number): number {
  return Math.abs(r - tr) + Math.abs(c - tc);
}

function chebyshev(r: number, c: number, tr: number, tc: number): number {
  return Math.max(Math.abs(r - tr), Math.abs(c - tc));
}

/**
 * Naked Single via top-down masking: start from a full solved grid, pick a
 * target cell, keep it empty + 8 clue cells (row/col/box with the other 8 digits),
 * then add organic distractors.
 */
export function generateNakedSingleBoard(difficulty: MiniBoardDifficulty): MiniBoardResult {
  for (let attempt = 0; attempt < MAX_GENERATOR_ATTEMPTS; attempt++) {
    const solved = generateSolvedGrid();
    const tR = Math.floor(Math.random() * 9);
    const tC = Math.floor(Math.random() * 9);
    const answerValue = solved[tR][tC];

    const rowCells = getRowCells(tR).filter(([r, c]) => !(r === tR && c === tC));
    const colCells = getColCells(tC).filter(([r, c]) => !(r === tR && c === tC));
    const boxIdx = getBoxIndex(tR, tC);
    const boxCells = getBoxCells(boxIdx).filter(([r, c]) => r !== tR || c !== tC);

    const regionCells = new Map<string, [number, number]>();
    for (const [r, c] of [...rowCells, ...colCells, ...boxCells]) {
      const key = `${r},${c}`;
      if (!regionCells.has(key)) regionCells.set(key, [r, c]);
    }
    const allRegion = [...regionCells.values()];

    const byDigit = new Map<number, [number, number][]>();
    for (const [r, c] of allRegion) {
      const d = solved[r][c];
      if (d === answerValue) continue;
      if (!byDigit.has(d)) byDigit.set(d, []);
      byDigit.get(d)!.push([r, c]);
    }

    const clueCells: [number, number][] = [];
    const needed = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== answerValue);
    if (needed.length !== 8) continue;

    let allFound = true;
    for (const d of needed) {
      const candidates = byDigit.get(d);
      if (!candidates || candidates.length === 0) {
        allFound = false;
        break;
      }
      let chosen: [number, number];
      if (difficulty <= 3) {
        candidates.sort((a, b) => manhattan(a[0], a[1], tR, tC) - manhattan(b[0], b[1], tR, tC));
        chosen = candidates[0];
      } else if (difficulty <= 7) {
        shuffle(candidates);
        chosen = candidates[0];
      } else {
        candidates.sort((a, b) => chebyshev(b[0], b[1], tR, tC) - chebyshev(a[0], a[1], tR, tC));
        chosen = candidates[0];
      }
      clueCells.push(chosen);
    }
    if (!allFound) continue;

    const initial = createEmptyBoard();
    initial[tR][tC] = 0;
    for (const [r, c] of clueCells) {
      initial[r][c] = solved[r][c];
    }

    const distractorPool: [number, number][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (r === tR || c === tC || getBoxIndex(r, c) === boxIdx) continue;
        if (initial[r][c] !== 0) continue;
        distractorPool.push([r, c]);
      }
    }
    shuffle(distractorPool);

    let numDistractors: number;
    if (difficulty <= 3) numDistractors = Math.floor(Math.random() * 6);
    else if (difficulty <= 7) numDistractors = 10 + Math.floor(Math.random() * 6);
    else numDistractors = 20 + Math.floor(Math.random() * 11);
    numDistractors = Math.min(numDistractors, distractorPool.length);
    for (let i = 0; i < numDistractors; i++) {
      const [r, c] = distractorPool[i];
      initial[r][c] = solved[r][c];
    }

    return {
      initial: initial.map((row) => [...row]),
      answer: { row: tR, col: tC, value: answerValue },
    };
  }
  throw new Error("Failed to generate Naked Single board after max attempts");
}

// ---------------------------------------------------------------------------
// Strategy dispatcher (naked_single and hidden_single only)
// ---------------------------------------------------------------------------

export function generateMiniBoardByStrategy(
  strategy: Strategy,
  difficulty: MiniBoardDifficulty
): MiniBoardResult {
  const d = Math.max(1, Math.min(10, difficulty)) as MiniBoardDifficulty;
  switch (strategy) {
    case "naked_single":
      return generateNakedSingleBoard(d);
    case "hidden_single":
      return generateHiddenSingleBoard(d);
    case "naked_pair":
    case "hidden_pair":
      throw new Error(`Mini board generation for "${strategy}" is not implemented yet.`);
    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}
