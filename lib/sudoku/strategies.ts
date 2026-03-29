import type { Board } from "./types";
import type { Strategy } from "./types";
import { BOARD_SIZE, BOX_SIZE } from "./types";
import { getBoxIndex } from "./constraints";
import { getCandidates, getAllCandidates } from "./candidates";

/** Cell position in a unit. */
interface CellPos {
  row: number;
  col: number;
}

/**
 * Get all cells in the row with the given index.
 * Returns an array of CellPos objects.
 */
function getRowCells(rowIndex: number): CellPos[] {
  const cells: CellPos[] = [];
  for (let c = 0; c < BOARD_SIZE; c++) cells.push({ row: rowIndex, col: c });
  return cells;
}

/**
 * Get all cells in the column with the given index.
 * Returns an array of CellPos objects.
 */
function getColCells(colIndex: number): CellPos[] {
  const cells: CellPos[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) cells.push({ row: r, col: colIndex });
  return cells;
}

/**
 * Get all cells in the box with the given index.
 * Returns an array of CellPos objects.
 */
function getBoxCells(boxIndex: number): CellPos[] {
  const startRow = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const startCol = (boxIndex % BOX_SIZE) * BOX_SIZE;
  const cells: CellPos[] = [];
  for (let r = startRow; r < startRow + BOX_SIZE; r++) {
    for (let c = startCol; c < startCol + BOX_SIZE; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/**
 * Get all cells in the row, column, and box containing the cell at (row, col).
 * Returns an array of arrays of CellPos objects.
 */
function getUnitsContaining(row: number, col: number): CellPos[][] {
  return [
    getRowCells(row),
    getColCells(col),
    getBoxCells(getBoxIndex(row, col)),
  ];
}

/**
 * Detect if cell (row, col) has only one candidate (naked single).
 */
export function detectNakedSingle(
  board: Board,
  row: number,
  col: number
): boolean {
  const candidates = getCandidates(board, row, col);
  return candidates.length === 1;
}

/**
 * Detect if value can only go in (row, col) within some unit (hidden single).
 */
export function detectHiddenSingle(
  board: Board,
  row: number,
  col: number,
  value: number
): boolean {
  const units = getUnitsContaining(row, col);
  for (const unit of units) {
    let onlyHere = true;
    for (const { row: r, col: c } of unit) {
      if (r === row && c === col) continue;
      if (board[r][c] !== 0) continue;
      if (getCandidates(board, r, c).includes(value)) {
        onlyHere = false;
        break;
      }
    }
    if (onlyHere) return true;
  }
  return false;
}

/**
 * Determine which strategy (if any) was used to place `value` at (row, col).
 * Board state should be *before* the move (cell at (row, col) is empty).
 * Only naked and hidden single are supported for now. Naked pair and hidden pair will be implemented later.
 */
/**
 * True if (row,col) is one of two cells forming a naked pair in this unit:
 * both have the same two candidates, and no other empty cell in the unit lists either digit.
 */
function cellInNakedPairInUnit(
  board: Board,
  unit: CellPos[],
  row: number,
  col: number
): boolean {
  if (board[row][col] !== 0) return false;
  const empties = unit.filter(({ row: r, col: c }) => board[r][c] === 0);
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
      if (
        (row === a.row && col === a.col) ||
        (row === b.row && col === b.col)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * True if (row,col) is one of two cells forming a hidden pair on digits d1,d2 in this unit.
 */
function cellInHiddenPairInUnit(
  board: Board,
  unit: CellPos[],
  row: number,
  col: number
): boolean {
  if (board[row][col] !== 0) return false;
  const empties = unit.filter(({ row: r, col: c }) => board[r][c] === 0);
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
          // Not a naked pair (same two-only lists)
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
          if (
            (row === a.row && col === a.col) ||
            (row === b.row && col === b.col)
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function cellInNakedPair(board: Board, row: number, col: number): boolean {
  for (const unit of getUnitsContaining(row, col)) {
    if (cellInNakedPairInUnit(board, unit, row, col)) return true;
  }
  return false;
}

function cellInHiddenPair(board: Board, row: number, col: number): boolean {
  for (const unit of getUnitsContaining(row, col)) {
    if (cellInHiddenPairInUnit(board, unit, row, col)) return true;
  }
  return false;
}

export function detectStrategyUsed(
  board: Board,
  row: number,
  col: number,
  value: number
): Strategy | null {
  const candidates = getCandidates(board, row, col);
  if (!candidates.includes(value)) return null;

  if (detectNakedSingle(board, row, col)) return "naked_single";
  if (detectHiddenSingle(board, row, col, value)) return "hidden_single";
  if (cellInNakedPair(board, row, col)) return "naked_pair";
  if (cellInHiddenPair(board, row, col)) return "hidden_pair";

  return null;
}
