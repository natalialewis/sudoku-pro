import type { Board } from "./types";
import {
  checkRowConstraint,
  checkColumnConstraint,
  checkBoxConstraint,
} from "./constraints";

export type ConstraintViolation = "row" | "column" | "box";

/** First Sudoku rule violated if `value` were placed at (row, col). */
export function getViolatedConstraint(
  board: Board,
  row: number,
  col: number,
  value: number
): ConstraintViolation | null {
  if (checkRowConstraint(board, row, col, value)) return "row";
  if (checkColumnConstraint(board, row, col, value)) return "column";
  if (checkBoxConstraint(board, row, col, value)) return "box";
  return null;
}

export function constraintViolationMessage(
  value: number,
  violation: ConstraintViolation
): string {
  switch (violation) {
    case "row":
      return `You entered ${value}, but there is already a ${value} in that cell's row.`;
    case "column":
      return `You entered ${value}, but there is already a ${value} in that cell's column.`;
    case "box":
      return `You entered ${value}, but there is already a ${value} in that cell's 3×3 box.`;
  }
}
