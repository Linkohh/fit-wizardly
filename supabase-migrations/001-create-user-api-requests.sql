-- Create user_api_requests table for exercise API rate limiting
CREATE TABLE IF NOT EXISTS user_api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INT NOT NULL DEFAULT 0,
  reset_date TIMESTAMP NOT NULL DEFAULT CURRENT_DATE::TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE user_api_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view/modify their own record
CREATE POLICY "Users can view own rate limit record"
  ON user_api_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limit record"
  ON user_api_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert rate limit records"
  ON user_api_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_api_requests_user_id ON user_api_requests(user_id);

-- Create function to reset daily limit at UTC midnight
CREATE OR REPLACE FUNCTION reset_api_requests_daily()
RETURNS TABLE(user_id UUID, request_count INT) AS $$
BEGIN
  RETURN QUERY
  UPDATE user_api_requests
  SET request_count = 0, reset_date = CURRENT_DATE::TIMESTAMP
  WHERE reset_date < CURRENT_DATE::TIMESTAMP
  RETURNING user_api_requests.user_id, user_api_requests.request_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
