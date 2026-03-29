import type { Board } from "./types";
import type { Strategy } from "./types";
import type { UnitType } from "./types";
import { BOARD_SIZE, BOX_SIZE } from "./types";
import { getBoxIndex, isValidMove } from "./constraints";
import { getAllCandidates, getCandidates } from "./candidates";

export type MiniBoardDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type NotesGrid = number[][][];

export interface MiniSingleAnswer {
  kind: "single";
  row: number;
  col: number;
  value: number;
}

export interface MiniPairAnswer {
  kind: "pair";
  cells: [{ row: number; col: number }, { row: number; col: number }];
  digits: [number, number];
  unit: { type: UnitType; index: number };
}

export interface MiniBoardResult {
  initial: Board;
  solution: Board;
  initialNotes?: NotesGrid;
  answer: MiniSingleAnswer | MiniPairAnswer;
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

function getUnitCells(unitType: UnitType, index: number): [number, number][] {
  if (unitType === "row") return getRowCells(index);
  if (unitType === "col") return getColCells(index);
  return getBoxCells(index);
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

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function createNotesGrid(board: Board): NotesGrid {
  const notes: NotesGrid = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => [] as number[])
  );
  for (const { row, col, candidates } of getAllCandidates(board)) {
    notes[row][col] = [...candidates];
  }
  return notes;
}

function countDistractorsForDifficulty(difficulty: MiniBoardDifficulty): number {
  if (difficulty <= 3) return Math.floor(Math.random() * 6);
  if (difficulty <= 7) return 10 + Math.floor(Math.random() * 6);
  return 20 + Math.floor(Math.random() * 11);
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
    solution: cloneBoard(solved),
    answer: { kind: "single", row: tR, col: tC, value: D },
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
      solution: cloneBoard(solved),
      answer: { kind: "single", row: tR, col: tC, value: answerValue },
    };
  }
  throw new Error("Failed to generate Naked Single board after max attempts");
}

// ---------------------------------------------------------------------------
// 3. Naked Pair Generator (top-down masking + candidate validation)
// ---------------------------------------------------------------------------

export function generateNakedPairBoard(difficulty: MiniBoardDifficulty): MiniBoardResult {
  for (let attempt = 0; attempt < MAX_GENERATOR_ATTEMPTS * 4; attempt++) {
    const solved = generateSolvedGrid();
    const unitType = pickRandom<UnitType>(["row", "col", "box"]);
    const unitIndex = Math.floor(Math.random() * BOARD_SIZE);
    const unitCells = getUnitCells(unitType, unitIndex);
    const pair = [...unitCells];
    shuffle(pair);
    const [aR, aC] = pair[0]!;
    const [bR, bC] = pair[1]!;

    const initial = cloneBoard(solved);
    initial[aR][aC] = 0;
    initial[bR][bC] = 0;

    // Keep additional empties in the same unit so the pair is visible in context.
    const remainingUnit = unitCells.filter(
      ([r, c]) => !(r === aR && c === aC) && !(r === bR && c === bC)
    );
    shuffle(remainingUnit);
    const extraInUnit = Math.min(
      remainingUnit.length,
      1 + Math.floor(difficulty / 3) + Math.floor(Math.random() * 2)
    );
    for (let i = 0; i < extraInUnit; i++) {
      const [r, c] = remainingUnit[i]!;
      initial[r][c] = 0;
    }

    // Add organic distractors outside the target unit.
    const distractorPool: [number, number][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (initial[r][c] === 0) continue;
        if (
          (unitType === "row" && r === unitIndex) ||
          (unitType === "col" && c === unitIndex) ||
          (unitType === "box" && getBoxIndex(r, c) === unitIndex)
        ) {
          continue;
        }
        distractorPool.push([r, c]);
      }
    }
    shuffle(distractorPool);
    const numDistractors = Math.min(countDistractorsForDifficulty(difficulty), distractorPool.length);
    for (let i = 0; i < numDistractors; i++) {
      const [r, c] = distractorPool[i]!;
      initial[r][c] = 0;
    }

    const candA = getCandidates(initial, aR, aC);
    const candB = getCandidates(initial, bR, bC);
    if (candA.length !== 2 || candB.length !== 2) continue;
    if (candA[0] !== candB[0] || candA[1] !== candB[1]) continue;
    const digits = [candA[0], candA[1]] as [number, number];

    // Ensure no other empty cell in unit can take either pair digit.
    let invalid = false;
    for (const [r, c] of unitCells) {
      if ((r === aR && c === aC) || (r === bR && c === bC)) continue;
      if (initial[r][c] !== 0) continue;
      const cs = getCandidates(initial, r, c);
      if (cs.includes(digits[0]) || cs.includes(digits[1])) {
        invalid = true;
        break;
      }
    }
    if (invalid) continue;

    return {
      initial: cloneBoard(initial),
      solution: cloneBoard(solved),
      initialNotes: createNotesGrid(initial),
      answer: {
        kind: "pair",
        cells: [
          { row: aR, col: aC },
          { row: bR, col: bC },
        ],
        digits,
        unit: { type: unitType, index: unitIndex },
      },
    };
  }
  throw new Error("Failed to generate Naked Pair board after max attempts");
}

// ---------------------------------------------------------------------------
// 4. Hidden Pair Generator (top-down masking + candidate validation)
// ---------------------------------------------------------------------------

export function generateHiddenPairBoard(difficulty: MiniBoardDifficulty): MiniBoardResult {
  for (let attempt = 0; attempt < MAX_GENERATOR_ATTEMPTS * 6; attempt++) {
    const solved = generateSolvedGrid();
    const unitType = pickRandom<UnitType>(["row", "col", "box"]);
    const unitIndex = Math.floor(Math.random() * BOARD_SIZE);
    const unitCells = getUnitCells(unitType, unitIndex);
    const pair = [...unitCells];
    shuffle(pair);
    const [aR, aC] = pair[0]!;
    const [bR, bC] = pair[1]!;

    const targetDigits = [solved[aR][aC], solved[bR][bC]].sort((x, y) => x - y) as [number, number];
    if (targetDigits[0] === targetDigits[1]) continue;

    const initial = cloneBoard(solved);
    initial[aR][aC] = 0;
    initial[bR][bC] = 0;

    const remainingUnit = unitCells.filter(
      ([r, c]) => !(r === aR && c === aC) && !(r === bR && c === bC)
    );
    shuffle(remainingUnit);
    const extraInUnit = Math.min(
      remainingUnit.length,
      2 + Math.floor(difficulty / 3) + Math.floor(Math.random() * 2)
    );
    for (let i = 0; i < extraInUnit; i++) {
      const [r, c] = remainingUnit[i]!;
      initial[r][c] = 0;
    }

    // More surrounding empties to encourage extra candidates in the pair cells.
    const neighborPool: [number, number][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (initial[r][c] === 0) continue;
        const sharesA = r === aR || c === aC || getBoxIndex(r, c) === getBoxIndex(aR, aC);
        const sharesB = r === bR || c === bC || getBoxIndex(r, c) === getBoxIndex(bR, bC);
        if (!sharesA && !sharesB) continue;
        if (
          (unitType === "row" && r === unitIndex) ||
          (unitType === "col" && c === unitIndex) ||
          (unitType === "box" && getBoxIndex(r, c) === unitIndex)
        ) {
          continue;
        }
        neighborPool.push([r, c]);
      }
    }
    shuffle(neighborPool);
    const neighborRemovals = Math.min(
      Math.floor(difficulty / 2) + 3 + Math.floor(Math.random() * 3),
      neighborPool.length
    );
    for (let i = 0; i < neighborRemovals; i++) {
      const [r, c] = neighborPool[i]!;
      initial[r][c] = 0;
    }

    // Organic distractors anywhere else.
    const distractorPool: [number, number][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (initial[r][c] !== 0) distractorPool.push([r, c]);
      }
    }
    shuffle(distractorPool);
    const numDistractors = Math.min(Math.floor(countDistractorsForDifficulty(difficulty) / 2), distractorPool.length);
    for (let i = 0; i < numDistractors; i++) {
      const [r, c] = distractorPool[i]!;
      initial[r][c] = 0;
    }

    const candA = getCandidates(initial, aR, aC);
    const candB = getCandidates(initial, bR, bC);
    if (!candA.includes(targetDigits[0]) || !candA.includes(targetDigits[1])) continue;
    if (!candB.includes(targetDigits[0]) || !candB.includes(targetDigits[1])) continue;
    if (candA.length <= 2 && candB.length <= 2) continue; // avoid collapsing into naked pair

    let countD1 = 0;
    let countD2 = 0;
    let onlyPairCellsForDigits = true;
    for (const [r, c] of unitCells) {
      if (initial[r][c] !== 0) continue;
      const cs = getCandidates(initial, r, c);
      if (cs.includes(targetDigits[0])) {
        countD1++;
        if (!((r === aR && c === aC) || (r === bR && c === bC))) onlyPairCellsForDigits = false;
      }
      if (cs.includes(targetDigits[1])) {
        countD2++;
        if (!((r === aR && c === aC) || (r === bR && c === bC))) onlyPairCellsForDigits = false;
      }
    }
    if (!onlyPairCellsForDigits) continue;
    if (countD1 !== 2 || countD2 !== 2) continue;

    return {
      initial: cloneBoard(initial),
      solution: cloneBoard(solved),
      initialNotes: createNotesGrid(initial),
      answer: {
        kind: "pair",
        cells: [
          { row: aR, col: aC },
          { row: bR, col: bC },
        ],
        digits: targetDigits,
        unit: { type: unitType, index: unitIndex },
      },
    };
  }
  throw new Error("Failed to generate Hidden Pair board after max attempts");
}

// ---------------------------------------------------------------------------
// Strategy dispatcher
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
      return generateNakedPairBoard(d);
    case "hidden_pair":
      return generateHiddenPairBoard(d);
    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}
