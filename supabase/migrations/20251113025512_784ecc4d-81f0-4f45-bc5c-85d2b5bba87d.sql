-- Create breathing_sessions table for tracking practice sessions
CREATE TABLE IF NOT EXISTS public.breathing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  inhalation_strength NUMERIC,
  inhalation_duration NUMERIC,
  holding_time NUMERIC,
  orientation_angle NUMERIC,
  result TEXT NOT NULL CHECK (result IN ('perfect', 'too_fast', 'too_slow', 'too_weak', 'wrong_angle', 'incomplete')),
  feedback_message TEXT,
  session_type TEXT DEFAULT 'practice' CHECK (session_type IN ('practice', 'guided', 'game')),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own sessions" 
ON public.breathing_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
ON public.breathing_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_breathing_sessions_user_date ON public.breathing_sessions(user_id, date DESC);

-- Add trigger for updated_at if needed in future
CREATE TRIGGER update_breathing_sessions_updated_at
BEFORE UPDATE ON public.breathing_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();