import type { Board } from "./types";
import type { UnitType } from "./types";
import { BOARD_SIZE, BOX_SIZE } from "./types";
import { getBoxIndex } from "./constraints";
import { getCandidates } from "./candidates";
import { detectNakedSingle, detectHiddenSingle } from "./strategies";

export interface StrategyHint {
  row: number;
  col: number;
  value: number;
  strategy: "naked_single" | "hidden_single";
}

export interface PairHint {
  strategy: "naked_pair" | "hidden_pair";
  cells: [{ row: number; col: number }, { row: number; col: number }];
  digits: [number, number];
  unit: { type: UnitType; index: number };
}

function getRowCells(row: number): { row: number; col: number }[] {
  return Array.from({ length: BOARD_SIZE }, (_, c) => ({ row, col: c }));
}

function getColCells(col: number): { row: number; col: number }[] {
  return Array.from({ length: BOARD_SIZE }, (_, r) => ({ row: r, col }));
}

function getBoxCells(boxIndex: number): { row: number; col: number }[] {
  const startR = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const startC = (boxIndex % BOX_SIZE) * BOX_SIZE;
  const out: { row: number; col: number }[] = [];
  for (let r = startR; r < startR + BOX_SIZE; r++) {
    for (let c = startC; c < startC + BOX_SIZE; c++) {
      out.push({ row: r, col: c });
    }
  }
  return out;
}

function findNakedPairInUnit(
  board: Board,
  cells: { row: number; col: number }[],
  unit: { type: UnitType; index: number }
): PairHint | null {
  const empties = cells.filter(({ row, col }) => board[row][col] === 0);
  for (let i = 0; i < empties.length; i++) {
    for (let j = i + 1; j < empties.length; j++) {
      const a = empties[i]!;
      const b = empties[j]!;
      const ca = getCandidates(board, a.row, a.col);
      const cb = getCandidates(board, b.row, b.col);
      if (ca.length !== 2 || cb.length !== 2) continue;
      if (ca[0] !== cb[0] || ca[1] !== cb[1]) continue;
      const d1 = ca[0]!;
      const d2 = ca[1]!;
      let ok = true;
      for (const e of empties) {
        if (
          (e.row === a.row && e.col === a.col) ||
          (e.row === b.row && e.col === b.col)
        ) {
          continue;
        }
        const cs = getCandidates(board, e.row, e.col);
        if (cs.includes(d1) || cs.includes(d2)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      return {
        strategy: "naked_pair",
        cells: [
          { row: a.row, col: a.col },
          { row: b.row, col: b.col },
        ],
        digits: [d1, d2],
        unit,
      };
    }
  }
  return null;
}

function findHiddenPairInUnit(
  board: Board,
  cells: { row: number; col: number }[],
  unit: { type: UnitType; index: number }
): PairHint | null {
  const empties = cells.filter(({ row, col }) => board[row][col] === 0);
  for (let i = 0; i < empties.length; i++) {
    for (let j = i + 1; j < empties.length; j++) {
      const a = empties[i]!;
      const b = empties[j]!;
      const ca = getCandidates(board, a.row, a.col);
      const cb = getCandidates(board, b.row, b.col);
      if (ca.length < 2 || cb.length < 2) continue;

      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          if (!ca.includes(d1) || !ca.includes(d2) || !cb.includes(d1) || !cb.includes(d2)) {
            continue;
          }
          if (
            ca.length === 2 &&
            cb.length === 2 &&
            ca[0] === cb[0] &&
            ca[1] === cb[1]
          ) {
            continue;
          }
          let ok = true;
          for (const e of empties) {
            if (
              (e.row === a.row && e.col === a.col) ||
              (e.row === b.row && e.col === b.col)
            ) {
              continue;
            }
            const cs = getCandidates(board, e.row, e.col);
            if (cs.includes(d1) || cs.includes(d2)) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
          return {
            strategy: "hidden_pair",
            cells: [
              { row: a.row, col: a.col },
              { row: b.row, col: b.col },
            ],
            digits: [d1, d2],
            unit,
          };
        }
      }
    }
  }
  return null;
}

/** First naked pair found scanning rows, then columns, then boxes. */
export function findFirstNakedPair(board: Board): PairHint | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    const hint = findNakedPairInUnit(board, getRowCells(r), { type: "row", index: r });
    if (hint) return hint;
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    const hint = findNakedPairInUnit(board, getColCells(c), { type: "col", index: c });
    if (hint) return hint;
  }
  for (let b = 0; b < BOARD_SIZE; b++) {
    const hint = findNakedPairInUnit(board, getBoxCells(b), { type: "box", index: b });
    if (hint) return hint;
  }
  return null;
}

/** First hidden pair found scanning rows, then columns, then boxes. */
export function findFirstHiddenPair(board: Board): PairHint | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    const hint = findHiddenPairInUnit(board, getRowCells(r), { type: "row", index: r });
    if (hint) return hint;
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    const hint = findHiddenPairInUnit(board, getColCells(c), { type: "col", index: c });
    if (hint) return hint;
  }
  for (let b = 0; b < BOARD_SIZE; b++) {
    const hint = findHiddenPairInUnit(board, getBoxCells(b), { type: "box", index: b });
    if (hint) return hint;
  }
  return null;
}

/** Find first naked single on the board. Naked single = cell with only one candidate. */
export function findFirstNakedSingle(board: Board): StrategyHint | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue;
      if (detectNakedSingle(board, r, c)) {
        const candidates = getCandidates(board, r, c);
        if (candidates.length === 1) {
          return { row: r, col: c, value: candidates[0]!, strategy: "naked_single" };
        }
      }
    }
  }
  return null;
}

/** Find first hidden single on the board. Hidden single = value can only go in one cell in a unit. */
export function findFirstHiddenSingle(board: Board): StrategyHint | null {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue;
      const candidates = getCandidates(board, r, c);
      for (const value of candidates) {
        if (detectHiddenSingle(board, r, c, value)) {
          return { row: r, col: c, value, strategy: "hidden_single" };
        }
      }
    }
  }
  return null;
}

/** Find first strategy hint (singles first, then pairs). */
export function findFirstStrategy(board: Board): StrategyHint | null {
  const naked = findFirstNakedSingle(board);
  if (naked) return naked;
  const hidden = findFirstHiddenSingle(board);
  if (hidden) return hidden;
  return null;
}

const BOX_NAMES: Record<number, string> = {
  0: "top-left",
  1: "top-center",
  2: "top-right",
  3: "middle-left",
  4: "center",
  5: "middle-right",
  6: "bottom-left",
  7: "bottom-center",
  8: "bottom-right",
};

export function getBoxName(boxIndex: number): string {
  return BOX_NAMES[boxIndex] ?? `box ${boxIndex + 1}`;
}
