/*
  # Add challenge participants table and policies

  1. New Tables
    - `challenge_participants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for reading and joining
*/

-- Create the table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all challenge participants" ON challenge_participants;
DROP POLICY IF EXISTS "Users can join challenge" ON challenge_participants;

-- Create policies
CREATE POLICY "Users can read all challenge participants"
  ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join challenge"
  ON challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);