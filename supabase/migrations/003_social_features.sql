-- ============================================
-- Migration 003: Social Features for Circle Hub
-- ============================================
-- Adds tables for reactions, comments, and rich posts
-- to enable social interactions within circles.

-- ============================================
-- TABLE: activity_reactions
-- Stores likes/reactions on circle activities
-- ============================================

CREATE TABLE IF NOT EXISTS activity_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES circle_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL DEFAULT 'like',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only have one reaction of each type per activity
    UNIQUE(activity_id, user_id, reaction_type)
);

-- Index for fetching reactions by activity
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity
    ON activity_reactions(activity_id);

-- Index for fetching user's reactions
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user
    ON activity_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on activities in their circles
CREATE POLICY "Users can view reactions in their circles" ON activity_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_activities ca
            JOIN circle_members cm ON ca.circle_id = cm.circle_id
            WHERE ca.id = activity_reactions.activity_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can add reactions to activities in their circles
CREATE POLICY "Users can add reactions in their circles" ON activity_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM circle_activities ca
            JOIN circle_members cm ON ca.circle_id = cm.circle_id
            WHERE ca.id = activity_reactions.activity_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions" ON activity_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE activity_reactions;

-- ============================================
-- TABLE: activity_comments
-- Stores comments on circle activities
-- ============================================

CREATE TABLE IF NOT EXISTS activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES circle_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching comments by activity
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity
    ON activity_comments(activity_id);

-- Index for fetching comments by creation time
CREATE INDEX IF NOT EXISTS idx_activity_comments_created
    ON activity_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on activities in their circles
CREATE POLICY "Users can view comments in their circles" ON activity_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_activities ca
            JOIN circle_members cm ON ca.circle_id = cm.circle_id
            WHERE ca.id = activity_comments.activity_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can add comments to activities in their circles
CREATE POLICY "Users can add comments in their circles" ON activity_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM circle_activities ca
            JOIN circle_members cm ON ca.circle_id = cm.circle_id
            WHERE ca.id = activity_comments.activity_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON activity_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON activity_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE activity_comments;

-- ============================================
-- TABLE: circle_posts
-- Stores rich text/image posts (user-generated content)
-- ============================================

CREATE TABLE IF NOT EXISTS circle_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    image_url TEXT,
    post_type TEXT NOT NULL DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching posts by circle
CREATE INDEX IF NOT EXISTS idx_circle_posts_circle
    ON circle_posts(circle_id);

-- Index for fetching posts by creation time
CREATE INDEX IF NOT EXISTS idx_circle_posts_created
    ON circle_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view posts in their circles
CREATE POLICY "Users can view posts in their circles" ON circle_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_members cm
            WHERE cm.circle_id = circle_posts.circle_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can create posts in their circles
CREATE POLICY "Users can create posts in their circles" ON circle_posts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM circle_members cm
            WHERE cm.circle_id = circle_posts.circle_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts" ON circle_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON circle_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE circle_posts;

-- ============================================
-- TABLE: challenge_participants
-- Tracks user participation and progress in challenges
-- ============================================

CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES circle_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only participate once per challenge
    UNIQUE(challenge_id, user_id)
);

-- Index for fetching participants by challenge
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge
    ON challenge_participants(challenge_id);

-- Index for leaderboard queries (score descending)
CREATE INDEX IF NOT EXISTS idx_challenge_participants_score
    ON challenge_participants(challenge_id, score DESC);

-- Enable Row Level Security
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view participants in challenges of their circles
CREATE POLICY "Users can view challenge participants in their circles" ON challenge_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_challenges cc
            JOIN circle_members cm ON cc.circle_id = cm.circle_id
            WHERE cc.id = challenge_participants.challenge_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can join challenges in their circles
CREATE POLICY "Users can join challenges in their circles" ON challenge_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM circle_challenges cc
            JOIN circle_members cm ON cc.circle_id = cm.circle_id
            WHERE cc.id = challenge_participants.challenge_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own participation (for progress updates)
CREATE POLICY "Users can update their own participation" ON challenge_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can leave challenges (delete their participation)
CREATE POLICY "Users can leave challenges" ON challenge_participants
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SCHEMA UPDATES: circle_challenges
-- Add status and goal tracking fields
-- ============================================

-- Add status field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'circle_challenges' AND column_name = 'status'
    ) THEN
        ALTER TABLE circle_challenges ADD COLUMN status TEXT DEFAULT 'upcoming';
    END IF;
END $$;

-- Add goal_value field for challenge targets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'circle_challenges' AND column_name = 'goal_value'
    ) THEN
        ALTER TABLE circle_challenges ADD COLUMN goal_value NUMERIC;
    END IF;
END $$;

-- Add unit field for challenge metrics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'circle_challenges' AND column_name = 'unit'
    ) THEN
        ALTER TABLE circle_challenges ADD COLUMN unit TEXT;
    END IF;
END $$;

-- ============================================
-- FUNCTION: Update challenge status automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on dates
    IF NEW.end_date < CURRENT_DATE THEN
        NEW.status := 'completed';
    ELSIF NEW.start_date <= CURRENT_DATE THEN
        NEW.status := 'active';
    ELSE
        NEW.status := 'upcoming';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_challenge_status'
    ) THEN
        CREATE TRIGGER trigger_update_challenge_status
            BEFORE INSERT OR UPDATE OF start_date, end_date ON circle_challenges
            FOR EACH ROW
            EXECUTE FUNCTION update_challenge_status();
    END IF;
END $$;
