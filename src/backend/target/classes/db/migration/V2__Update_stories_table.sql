-- Migration: Update stories table schema for submission workflow
-- New workflow: DRAFT → SUBMITTED → APPROVED → REJECTED
-- Add fields: coAuthor, submission_status
-- Rename: author_id → user_id, update type options
-- Genres/Topics: from array to single dropdown value

-- Add coAuthor column
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS co_author VARCHAR(255);

-- Add submission_status column (DRAFT, SUBMITTED, APPROVED, REJECTED)
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS submission_status VARCHAR(50) DEFAULT 'DRAFT';

-- Rename author_id to user_id if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'author_id') THEN
    ALTER TABLE stories RENAME COLUMN author_id TO user_id;
  END IF;
END $$;

-- Ensure foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'stories' AND constraint_name = 'fk_stories_user_id') THEN
    ALTER TABLE stories 
    ADD CONSTRAINT fk_stories_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update type column to accept dropdown values only (Một chương, Nhiều chương)
-- Note: Check constraint can be added if needed

-- Update genres/topics to store single dropdown value (not JSON array)
-- They already exist from previous migration, just ensure they're VARCHAR/TEXT

COMMIT;
