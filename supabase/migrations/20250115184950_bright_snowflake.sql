/*
  # Add Challenge Participants Table

  1. New Tables
    - `challenge_participants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on `challenge_participants` table
    - Add policies for:
      - All authenticated users can read participants
      - Users can only join once
      - Users can only join for themselves
*/

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read participants
CREATE POLICY "Users can read all challenge participants"
  ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to join the challenge (insert their own record)
CREATE POLICY "Users can join challenge"
  ON challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);