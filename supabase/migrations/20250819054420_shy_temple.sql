/*
  # Fix user_sessions table schema
  Ensure proper columns exist with correct types and defaults
*/

-- Add missing columns to user_sessions table if they don't exist
DO $$
BEGIN
  -- Check and add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Check and add left_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'left_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN left_at TIMESTAMPTZ;
  END IF;

  -- Check and add duration column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'duration'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN duration INTEGER;
  END IF;
END $$;

-- Update existing records to have created_at if null
UPDATE user_sessions 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_left_at ON user_sessions(left_at);

-- Test the query to ensure it works
SELECT id, created_at, left_at FROM user_sessions LIMIT 1;