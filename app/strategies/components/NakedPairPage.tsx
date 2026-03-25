import { StaticBoard, type Board, type NotesGrid } from "@/components/ui/StaticBoard";

/** Naked pair {5,6} in row 5, column 2 and 7. */
const NA1_BOARD: Board = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 3, 0, 0, 0, 0, 9, 3, 7],
  [1, 0, 2, 0, 3, 0, 0, 0, 0],
  [7, 8, 9, 0, 0, 0, 8, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 4, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const NA1_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [5, 6], [], [4, 5, 6, 7, 8, 9], [], [4, 5, 6, 7, 8, 9], [5, 6], [4, 5, 6, 7, 8, 9], [4, 5, 6, 7, 8, 9]],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
];

const NA1_PAIR = [
  { row: 4, col: 1 },
  { row: 4, col: 6 },
];
const NA1_STRONG = [
  { row: 4, col: 1, digits: [5, 6] },
  { row: 4, col: 6, digits: [5, 6] },
];

/** Naked pair {2,8} in column 5 (index 4). */
const NA2_BOARD: Board = [
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 4], 
  [0, 0, 0, 6, 1, 7, 0, 0, 0],
  [6, 0, 0, 0, 0, 0, 0, 0, 0], 
  [0, 0, 0, 0, 5, 0, 4, 0, 0],
  [0, 0, 0, 7, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 9, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const NA2_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [2, 8], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [2, 8], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [2, 4, 6, 8], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [2, 4, 6, 7, 8], [], [], [], []],
  [[], [], [], [], [2, 4, 6, 7,8], [], [], [], []],
];

const NA2_PAIR = [
  { row: 1, col: 4 },
  { row: 3, col: 4 },
];
const NA2_STRONG = [
  { row: 1, col: 4, digits: [2, 8] },
  { row: 3, col: 4, digits: [2, 8] },
];

/** Naked pair {8,9} in center box; only those two cells list 8 or 9. */
const NA3_BOARD: Board = [
  [0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 7, 0, 0, 0],
  [8, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 6, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 5, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0, 0],
];

const NA3_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [8, 9], [], [], [], []],
  [[], [], [], [3, 4, 5, 9], [3, 4, 5, 9], [3, 4, 5, 9], [], [], []],
  [[], [], [], [], [8, 9], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
];

const NA3_PAIR = [
  { row: 3, col: 4 },
  { row: 5, col: 4 },
];
const NA3_STRONG = [
  { row: 3, col: 4, digits: [8, 9] },
  { row: 5, col: 4, digits: [8, 9] },
];

export function NakedPairPage() {
  return (
    <div className="space-y-6 text-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">What it is</h2>
        <p className="text-muted-foreground">
          A <strong className="text-foreground">naked pair</strong> occurs when two cells in the same row, column, or 3×3 box contain the exact same two digits as candidates. Since these digits cannot appear anywhere else in that unit, you can remove them from the potential candidates in all other cells in that unit.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">How to spot it</h2>
        <p className="text-muted-foreground mb-4">
          Within one row, one column, or one box, look for two empty cells whose candidates are the same two numbers and no other digits.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Examples</h2>
        <div className="space-y-6">
          <StaticBoard
            board={NA1_BOARD}
            notes={NA1_NOTES}
            pairCells={NA1_PAIR}
            strongNoteDigits={NA1_STRONG}
            label="Example 1 (row)"
            caption="In the middle row, the two highlighted cells have exactly two candidates: 5 and 6, resulting in a naked pair. Thus, the 5 and 6 can be removed from candidates in the other cells in the row."
          />
          <StaticBoard
            board={NA2_BOARD}
            notes={NA2_NOTES}
            pairCells={NA2_PAIR}
            strongNoteDigits={NA2_STRONG}
            label="Example 2 (column)"
            caption="In the middle column, the two highlighted cells have exactly two candidates: 2 and 8, resulting in a naked pair. Thus, the 2 and 8 can be removed from candidates in the other cells in the column."
          />
          <StaticBoard
            board={NA3_BOARD}
            notes={NA3_NOTES}
            pairCells={NA3_PAIR}
            strongNoteDigits={NA3_STRONG}
            label="Example 3 (box)"
            caption="In the center box, the two highlighted cells have exactly two candidates: 8 and 9, resulting in a naked pair. Thus, the 8 and 9 can be removed from candidates in the other cells in the box."
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Why it helps</h2>
        <p className="text-muted-foreground">
          Naked pairs shrink candidate lists in a unit without placing a digit yet. Clearing wrong noted candidates often exposes naked singles or makes the next pattern easier to see.
        </p>
      </section>
    </div>
  );
}
