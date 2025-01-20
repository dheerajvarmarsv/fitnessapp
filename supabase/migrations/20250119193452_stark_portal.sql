/*
  # Add grace policy and penalties tracking

  1. Changes
    - Add grace_workout_used column to users table
    - Add penalty_amount column to weekly_stats table
    - Update points calculation to handle grace policy
    - Add function to calculate weekly penalties

  2. Notes
    - Grace policy allows one missed workout without penalty
    - Penalties are ₹500 per missed workout after grace is used
*/

-- Add grace_workout_used column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'grace_workout_used'
  ) THEN
    ALTER TABLE users ADD COLUMN grace_workout_used boolean DEFAULT false;
  END IF;
END $$;

-- Add penalty_amount column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'weekly_stats' 
    AND column_name = 'penalty_amount'
  ) THEN
    ALTER TABLE weekly_stats ADD COLUMN penalty_amount integer DEFAULT 0;
  END IF;
END $$;

-- Function to calculate weekly penalties
CREATE OR REPLACE FUNCTION calculate_weekly_penalties()
RETURNS trigger AS $$
DECLARE
  workouts_this_week integer;
  has_used_grace boolean;
  penalty integer;
BEGIN
  -- Get number of workouts this week
  SELECT COUNT(*)
  INTO workouts_this_week
  FROM daily_logs
  WHERE user_id = NEW.user_id
    AND date_trunc('week', date) = date_trunc('week', NEW.week_start)
    AND workout_completed = true;

  -- Check if grace has been used
  SELECT grace_workout_used
  INTO has_used_grace
  FROM users
  WHERE id = NEW.user_id;

  -- Calculate penalty
  IF workouts_this_week < 5 THEN
    IF NOT has_used_grace THEN
      -- Use grace policy
      UPDATE users SET grace_workout_used = true WHERE id = NEW.user_id;
      penalty := 0;
    ELSE
      -- Calculate penalty (₹500 per missed workout)
      penalty := (5 - workouts_this_week) * 500;
    END IF;
  ELSE
    penalty := 0;
  END IF;

  NEW.penalty_amount := penalty;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weekly penalties calculation
DROP TRIGGER IF EXISTS calculate_penalties_trigger ON weekly_stats;
CREATE TRIGGER calculate_penalties_trigger
  BEFORE INSERT OR UPDATE ON weekly_stats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weekly_penalties();