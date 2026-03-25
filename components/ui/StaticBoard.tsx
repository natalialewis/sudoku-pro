/** Simple static 9×9 Sudoku grid. Optional answer cell highlight, pencil marks, pair highlights. */

/** 9x9 grid: 0 = empty. */
export type Board = number[][];

/** Per-cell pencil marks (1–9). Only used when board cell is 0. */
export type NotesGrid = (number[] | undefined)[][];

export interface StaticBoardProps {
  board: Board;
  answerCell?: { row: number; col: number; value: number };
  /** Pencil marks for empty cells; same shape as board. */
  notes?: NotesGrid;
  /** Cells forming the pair (e.g. naked/hidden pair), shown with a purple ring. */
  pairCells?: { row: number; col: number }[];
  /** In the 3×3 note grid, these digits render in purple (e.g. the pair digits). */
  strongNoteDigits?: { row: number; col: number; digits: number[] }[];
  label?: string;
  caption?: string;
}

function buildStrongNoteSet(
  entries: { row: number; col: number; digits: number[] }[] | undefined
): Set<string> {
  const s = new Set<string>();
  if (!entries) return s;
  for (const { row, col, digits } of entries) {
    for (const d of digits) s.add(`${row}-${col}-${d}`);
  }
  return s;
}

export function StaticBoard({
  board,
  answerCell,
  notes,
  pairCells,
  strongNoteDigits,
  label,
  caption,
}: StaticBoardProps) {
  const pairSet = new Set(
    (pairCells ?? []).map((p) => `${p.row}-${p.col}`)
  );
  const strongNotes = buildStrongNoteSet(strongNoteDigits);

  const usesNotes =
    notes != null &&
    board.some((row, r) =>
      row.some((val, c) => val === 0 && (notes[r]?.[c]?.length ?? 0) > 0)
    );
  const cellBox = usesNotes
    ? "h-10 w-10 min-h-10 min-w-10"
    : "h-9 w-9 min-h-9 min-w-9 text-sm";

  return (
    <figure>
      {label && (
        <figcaption className="mb-2 text-sm font-medium text-foreground">
          {label}
        </figcaption>
      )}
      <div className="inline-grid w-fit grid-cols-9 border-2 border-foreground/20 bg-card rounded-lg overflow-hidden shadow-sm">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isAnswer =
              answerCell && answerCell.row === r && answerCell.col === c;
            const displayVal = isAnswer && answerCell ? answerCell.value : val;
            const isPair = pairSet.has(`${r}-${c}`);
            const borderRight = c === 2 || c === 5 ? "border-r-2 border-foreground/30" : "border-r border-border";
            const borderBottom = r === 2 || r === 5 ? "border-b-2 border-foreground/30" : "border-b border-border";

            let ring = "";
            let bg = "bg-card text-foreground";
            if (isAnswer) {
              bg = "bg-primary/25 font-semibold text-primary";
              ring = "ring-2 ring-primary ring-inset";
            } else if (isPair) {
              bg = "bg-purple-500/10 text-foreground";
              ring = "ring-2 ring-purple-600 ring-inset dark:ring-purple-400";
            }

            const noteList = notes?.[r]?.[c];
            const showNotes =
              displayVal === 0 &&
              noteList != null &&
              noteList.length > 0;

            return (
              <div
                key={`${r}-${c}`}
                className={`flex ${cellBox} items-center justify-center border-border tabular-nums text-sm ${borderRight} ${borderBottom} ${bg} ${ring}`}
              >
                {showNotes ? (
                  <span className="grid grid-cols-3 grid-rows-3 h-full w-full place-items-center text-[9px] text-muted-foreground p-0.5 leading-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                      const on = noteList.includes(n);
                      const strong = strongNotes.has(`${r}-${c}-${n}`);
                      return (
                        <span
                          key={n}
                          className={
                            strong
                              ? "font-semibold text-purple-600 dark:text-purple-400"
                              : ""
                          }
                        >
                          {on ? n : "\u00A0"}
                        </span>
                      );
                    })}
                  </span>
                ) : displayVal === 0 ? (
                  ""
                ) : (
                  displayVal
                )}
              </div>
            );
          })
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-muted-foreground max-w-[20rem]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
