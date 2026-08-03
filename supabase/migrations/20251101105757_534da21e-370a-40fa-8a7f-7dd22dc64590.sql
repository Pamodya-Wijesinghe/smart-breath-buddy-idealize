-- Create enum for asthma severity levels
CREATE TYPE asthma_severity AS ENUM ('mild', 'moderate', 'severe');

-- Create enum for inhalation results
CREATE TYPE inhalation_result AS ENUM ('correct', 'too_fast', 'too_weak', 'wrong_angle', 'mistimed');

-- Create enum for notification types
CREATE TYPE notification_type AS ENUM ('inhalation_alert', 'daily_reminder', 'battery_alert', 'device_sync', 'achievement');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  asthma_severity asthma_severity DEFAULT 'mild',
  is_child BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  esp32_id TEXT UNIQUE NOT NULL,
  firmware_version TEXT,
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  is_charging BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inhalation_logs table
CREATE TABLE public.inhalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  inhalation_strength DECIMAL(5,2), -- in liters per minute
  duration DECIMAL(5,2), -- in seconds
  orientation_angle DECIMAL(5,2), -- in degrees
  result inhalation_result NOT NULL,
  feedback_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create asthma_diary table
CREATE TABLE public.asthma_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptom_notes TEXT,
  triggers TEXT,
  medication_time TIME,
  inhaler_uses INTEGER DEFAULT 0,
  symptom_severity INTEGER CHECK (symptom_severity >= 1 AND symptom_severity <= 10),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inhalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asthma_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for devices
CREATE POLICY "Users can view own devices"
  ON public.devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
  ON public.devices FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for inhalation_logs
CREATE POLICY "Users can view own logs"
  ON public.inhalation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.inhalation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for asthma_diary
CREATE POLICY "Users can view own diary"
  ON public.asthma_diary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own diary"
  ON public.asthma_diary FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_inhalation_logs_user_id ON public.inhalation_logs(user_id);
CREATE INDEX idx_inhalation_logs_timestamp ON public.inhalation_logs(timestamp DESC);
CREATE INDEX idx_asthma_diary_user_date ON public.asthma_diary(user_id, date DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);