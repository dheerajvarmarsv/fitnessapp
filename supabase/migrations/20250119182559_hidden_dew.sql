/*
  # Add step count and update points calculation

  1. Changes
    - Add step_count column to daily_logs table
    - Update points calculation to include step count bonus
    - Fix weekly workout points calculation
    - Recreate trigger with latest function

  2. Points System
    - Base workout points: 5 points per workout (first 5 workouts)
    - Extra workout bonus: 10 points (6th and 7th workouts)
    - Sleep bonus: 5 points (7+ hours)
    - Screen time bonus: 5 points (under 5 hours)
    - No sugar bonus: 4 points
    - Step count bonus: 5 points (12K+ steps)
*/

-- Safely add step_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'daily_logs' 
    AND column_name = 'step_count'
  ) THEN
    ALTER TABLE daily_logs ADD COLUMN step_count integer;
  END IF;
END $$;

-- Update points calculation function with all bonuses
CREATE OR REPLACE FUNCTION calculate_daily_points()
RETURNS trigger AS $$
DECLARE
  workouts_this_week integer;
BEGIN
  NEW.points := 0;
  
  -- Get number of workouts this week (including this one)
  SELECT COUNT(*)
  INTO workouts_this_week
  FROM daily_logs
  WHERE user_id = NEW.user_id
    AND date_trunc('week', date) = date_trunc('week', NEW.date)
    AND workout_completed = true;

  -- Base workout points (5 points for each of first 5 workouts)
  IF NEW.workout_completed AND NEW.workout_duration >= 30 THEN
    IF workouts_this_week <= 5 THEN
      NEW.points := NEW.points + 5;
    ELSE
      -- Bonus points for 6th and 7th workouts (10 points each)
      NEW.points := NEW.points + 10;
    END IF;
  END IF;
  
  -- Sleep bonus (7+ hours: 5 points)
  IF NEW.sleep_hours >= 7 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  -- Screen time bonus (under 5 hours: 5 points)
  IF NEW.screen_time_hours < 5 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  -- No sugar bonus (4 points)
  IF NEW.no_sugar THEN
    NEW.points := NEW.points + 4;
  END IF;

  -- Step count bonus (12K+ steps: 5 points)
  IF NEW.step_count >= 12000 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's using the latest function version
DROP TRIGGER IF EXISTS calculate_points_trigger ON daily_logs;
CREATE TRIGGER calculate_points_trigger
  BEFORE INSERT OR UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_daily_points();