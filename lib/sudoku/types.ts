/**
 * Sudoku board: 9x9 grid. 0 = empty, 1-9 = given or filled value.
 * board[row][col], indices 0-8.
 */
export type Board = number[][];

/** Cell position and optional value (for hints, moves, etc.) */
export interface Cell {
  row: number;
  col: number;
  value: number;
}

/** Strategy names matching DB knowledge_component and plan. */
export const STRATEGIES = [
  "naked_single",
  "hidden_single",
  "naked_pair",
  "hidden_pair",
] as const;

export type Strategy = (typeof STRATEGIES)[number];

/** Unit type for row/column/box. */
export type UnitType = "row" | "col" | "box";

/** A unit (row, column, or 3x3 box) identified by index 0-8. */
export interface Unit {
  type: UnitType;
  index: number;
}

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;

/** Valid digit range. */
export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

export function isDigit(n: number): n is Digit {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}
