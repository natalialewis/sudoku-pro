-- Stores information about Sudoku game boards
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type TEXT NOT NULL CHECK (board_type IN ('full', 'mini')),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    strategy_focus TEXT CHECK (strategy_focus IN ('naked_single', 'hidden_single', 'naked_pair', 'hidden_pair', NULL)),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10), -- 1-10 for mini boards, NULL for full
    initial_state JSONB NOT NULL, -- 9x9 grid: [[0-9, ...], ...] where 0 = empty
    solution JSONB NOT NULL, -- Complete solution
    initial_notes JSONB, -- Mini boards only: pencil marks (9x9 array of arrays of digits). Required for pair strategies in tutor.
    mini_answer JSONB  -- Mini boards only: tutor answer metadata from the generator ({ kind: "single", ... } | { kind: "pair", ... }).

);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_boards_type ON boards(board_type);
CREATE INDEX idx_boards_strategy ON boards(strategy_focus);
CREATE INDEX idx_boards_difficulty ON boards(difficulty);

-- Only allow people to view board, whether they are authenticated or not
CREATE POLICY "Boards are viewable by everyone"
ON boards
FOR SELECT
TO public
USING (TRUE);