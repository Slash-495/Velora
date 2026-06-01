-- Migration: Analytics and Profile System

-- Table: analytics_events
-- Tracks activity like 'created_resume', 'applied_job', 'practiced_interview' for the Heatmap.
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: ats_history
-- Tracks ATS score changes over time for specific resumes
CREATE TABLE ats_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: user_milestones
-- Tracks achievements the user has unlocked
CREATE TABLE user_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  milestone_id TEXT NOT NULL, -- e.g., 'first_resume', 'first_interview'
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, milestone_id)
);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Note: In a real app, Policies would restrict SELECT/INSERT/UPDATE to auth.uid() = user_id.
