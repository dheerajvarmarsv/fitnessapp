/*
  # Initial Fitness Challenge Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `created_at` (timestamp)
      - `grace_workout_used` (boolean)
    
    - `daily_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `date` (date)
      - `workout_completed` (boolean)
      - `workout_duration` (integer)
      - `workout_proof_url` (text)
      - `sleep_hours` (numeric)
      - `screen_time_hours` (numeric)
      - `no_sugar` (boolean)
      - `points` (integer)
      - `created_at` (timestamp)

    - `weekly_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `week_start` (date)
      - `week_end` (date)
      - `workouts_completed` (integer)
      - `bonus_points` (integer)
      - `penalty_amount` (integer)
      - `streak_bonus` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  grace_workout_used boolean DEFAULT false
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  date date NOT NULL,
  workout_completed boolean DEFAULT false,
  workout_duration integer,
  workout_proof_url text,
  sleep_hours numeric,
  screen_time_hours numeric,
  no_sugar boolean DEFAULT false,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all daily logs"
  ON daily_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON daily_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Weekly stats table
CREATE TABLE IF NOT EXISTS weekly_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  workouts_completed integer DEFAULT 0,
  bonus_points integer DEFAULT 0,
  penalty_amount integer DEFAULT 0,
  streak_bonus boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all weekly stats"
  ON weekly_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage weekly stats"
  ON weekly_stats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to calculate points
CREATE OR REPLACE FUNCTION calculate_daily_points()
RETURNS trigger AS $$
BEGIN
  NEW.points := 0;
  
  -- Base workout points
  IF NEW.workout_completed AND NEW.workout_duration >= 30 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  -- Sleep bonus
  IF NEW.sleep_hours >= 7 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  -- Screen time bonus
  IF NEW.screen_time_hours < 5 THEN
    NEW.points := NEW.points + 5;
  END IF;
  
  -- No sugar bonus
  IF NEW.no_sugar THEN
    NEW.points := NEW.points + 4;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points calculation
CREATE TRIGGER calculate_points_trigger
  BEFORE INSERT OR UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_daily_points();