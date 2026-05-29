-- Migration: Interview Preparation System

-- Table: interview_sessions
-- Stores overarching context for a mock interview
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  status TEXT DEFAULT 'In Progress', -- 'In Progress', 'Completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: interview_questions
-- Stores generated questions, user answers, and AI feedback
CREATE TABLE interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Technical', 'Behavioral', 'Resume Deep-Dive', 'System Design'
  user_answer TEXT,
  ai_feedback TEXT,
  score INTEGER, -- 1-100
  missing_concepts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Note: In a real app, Policies would restrict SELECT/INSERT/UPDATE to auth.uid() = user_id.
