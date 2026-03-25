import { StaticBoard, type Board, type NotesGrid } from "@/components/ui/StaticBoard";

/** Hidden pair {5,6} in row 3 (index 2): those digits only in two cells that also list 7 or 9. */
const HP1_BOARD: Board = [
  [0, 9, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 6, 5],
  [8, 0, 3, 0, 1, 0, 0, 0, 4],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 6, 0, 0, 0],
  [0, 0, 0, 0, 0, 5, 0, 0, 0],
];

const HP1_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [2, 5, 6, 7], [], [2, 5, 6, 7, 9], [2, 7, 9], [2, 7, 9], [], [2, 7, 9], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
];

const HP1_PAIR = [
  { row: 2, col: 1 },
  { row: 2, col: 3 },
];
const HP1_STRONG = [
  { row: 2, col: 1, digits: [5, 6] },
  { row: 2, col: 3, digits: [5, 6] },
];

/** Hidden pair {1,4} in column 7 (index 6). */
const HP2_BOARD: Board = [
  [0, 0, 0, 0, 0, 0, 5, 6, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2],
  [0, 0, 0, 0, 0, 0, 8, 7, 0],
  [0, 0, 0, 0, 7, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 0, 8],
  [0, 0, 1, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 9, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1],
];

const HP2_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [1, 4, 7], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [1, 4, 6], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [2, 6, 7], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [2, 6, 7], [], []],
  [[], [], [], [], [], [], [2, 6, 7], [], []],
];

const HP2_PAIR = [
  { row: 1, col: 6 },
  { row: 3, col: 6 },
];
const HP2_STRONG = [
  { row: 1, col: 6, digits: [1, 4] },
  { row: 3, col: 6, digits: [1, 4] },
];

/** Hidden pair {2,5} in top-right box (box 3). */
const HP3_BOARD: Board = [
  [0, 0, 0, 0, 0, 0, 0, 8, 1],
  [0, 0, 0, 0, 0, 0, 9, 0, 0],
  [0, 0, 0, 0, 2, 5, 0, 0, 4],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0, 5],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const HP3_NOTES: NotesGrid = [
  [[], [], [], [], [], [], [2, 3, 5, 6, 7], [], []],
  [[], [], [], [], [], [], [], [2, 3, 5, 6, 7], [3, 6, 7]],
  [[], [], [], [], [], [], [3, 6, 7], [3, 6, 7], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
  [[], [], [], [], [], [], [], [], []],
];

const HP3_PAIR = [
  { row: 0, col: 6 },
  { row: 1, col: 7 },
];
const HP3_STRONG = [
  { row: 0, col: 6, digits: [2, 5] },
  { row: 1, col: 7, digits: [2, 5] },
];

export function HiddenPairPage() {
  return (
    <div className="space-y-6 text-foreground">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">What it is</h2>
        <p className="text-muted-foreground">
          A <strong className="text-foreground">hidden pair</strong> occurs when two cells in the same row, column, or 3x3 box have the same two candidates and those two candidates don't appear anywhere else in that unit. These candidates are considered "hidden" because the cells have other candidates too. However, because the two candidates in the hidden pair have nowhere else to go in that unit, they are logically locked into those two cells.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">How to spot it</h2>
        <p className="text-muted-foreground mb-4">
          Within one row, one column, or one box, look for two cells that have the same two candidates (amongst their other candidates). Then, scan the rest of the unit: if no other cell contains either of those two candidates, you have found a hidden pair.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Examples</h2>
        <div className="space-y-6">
          <StaticBoard
            board={HP1_BOARD}
            notes={HP1_NOTES}
            pairCells={HP1_PAIR}
            strongNoteDigits={HP1_STRONG}
            label="Example 1 (row)"
            caption="In this row, 5 and 6 each appear as candidates only in the highlighted cells. Thus, the other candidates in the highlighted cells can be removed."
          />
          <StaticBoard
            board={HP2_BOARD}
            notes={HP2_NOTES}
            pairCells={HP2_PAIR}
            strongNoteDigits={HP2_STRONG}
            label="Example 2 (column)"
            caption="In this column, 1 and 4 each appear as candidates only in the highlighted cells. Thus, the other candidates in the highlighted cells can be removed."
          />
          <StaticBoard
            board={HP3_BOARD}
            notes={HP3_NOTES}
            pairCells={HP3_PAIR}
            strongNoteDigits={HP3_STRONG}
            label="Example 3 (box)"
            caption="In the top-right box, 2 and 5 each appear as candidates only in the highlighted cells. Thus, the other candidates in the highlighted cells can be removed."
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Why it helps</h2>
        <p className="text-muted-foreground">
          Hidden pairs strip away distracting candidates from two specific cells, effectively turning them into a naked pair. More eliminations can then be made from the naked pair.
        </p>
      </section>
    </div>
  );
}
