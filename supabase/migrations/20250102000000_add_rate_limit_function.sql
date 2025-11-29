-- Create function to increment rate limit counter
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_window_type VARCHAR(10),
  p_window_start TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_rate_limits (user_id, window_type, window_start, request_count)
  VALUES (p_user_id, p_window_type, p_window_start, 1)
  ON CONFLICT (user_id, window_type, window_start)
  DO UPDATE SET request_count = ai_rate_limits.request_count + 1;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION increment_rate_limit IS 'Increment AI API rate limit counter for a user';
