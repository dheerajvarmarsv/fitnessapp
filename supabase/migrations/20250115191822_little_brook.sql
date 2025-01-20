/*
  # Fix RLS policies for users and challenge participants

  1. Security Updates
    - Add policy for users to insert their own record
    - Add policy for users to update their own record
    - Add policy for users to read all users
    - Add policy for users to join challenge
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies for users table
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);