import type { Board } from "./types";
import { BOARD_SIZE } from "./types";
import { isValidMove } from "./constraints";

/**
 * Get possible values (1-9) for cell (row, col). Returns [] if cell is already filled.
 */
export function getCandidates(board: Board, row: number, col: number): number[] {
  // If the cell is already filled, return an empty array
  if (board[row][col] !== 0) return [];
  const candidates: number[] = [];
  // Check all possible values (1-9) for the cell
  for (let value = 1; value <= BOARD_SIZE; value++) {
    // If the value doesn't violate any constraints, add it to the candidates
    if (isValidMove(board, row, col, value)) candidates.push(value);
  }
  return candidates;
}

export interface CellCandidates {
  row: number;
  col: number;
  candidates: number[];
}

/**
 * Get candidates for all empty cells on the board.
 */
export function getAllCandidates(board: Board): CellCandidates[] {
  const result: CellCandidates[] = [];
  // For each row and column, if the cell is empty, get the candidates for that cell
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 0) continue;
      const candidates = getCandidates(board, r, c);
      result.push({ row: r, col: c, candidates });
    }
  }
  return result;
}
