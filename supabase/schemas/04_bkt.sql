-- Stores BKT probabilities per user per knowledge component
CREATE TABLE bkt_probabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    knowledge_component TEXT NOT NULL CHECK (knowledge_component IN ('naked_single', 'hidden_single', 'naked_pair', 'hidden_pair')),
    p_learned DECIMAL(5,4) NOT NULL DEFAULT 0.1, -- p(L0) - initial probability
    p_transit DECIMAL(5,4) NOT NULL DEFAULT 0.3, -- p(T) - probability of learning
    p_guess DECIMAL(5,4) NOT NULL DEFAULT 0.1, -- p(G) - probability of guessing correctly
    p_slip DECIMAL(5,4) NOT NULL DEFAULT 0.05, -- p(S) - probability of slipping
    mastery_probability DECIMAL(5,4) NOT NULL DEFAULT 0.1, -- Current P(L|obs)
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, knowledge_component)
);

CREATE INDEX idx_bkt_user ON bkt_probabilities(user_id);
CREATE INDEX idx_bkt_kc ON bkt_probabilities(knowledge_component);

ALTER TABLE bkt_probabilities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "BKT probabilities are viewable by the owner"
ON bkt_probabilities
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "BKT probabilities are insertable by the owner"
ON bkt_probabilities
FOR INSERT
TO authenticated
WITH CHECK (((select auth.uid()) = user_id));

CREATE POLICY "BKT probabilities are updatable by the owner"
ON bkt_probabilities
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK (((select auth.uid()) = user_id));

-- Trigger to update the updated_at column
CREATE TRIGGER set_updated_at_bkt
BEFORE UPDATE ON bkt_probabilities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();