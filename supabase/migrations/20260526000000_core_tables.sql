-- Migration: Core Tables & Templates System

-- Table: career_tracks
CREATE TABLE career_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: resume_templates
CREATE TABLE resume_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_ats_friendly BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: resume_theme_configs
-- Note: Instead of a separate table, it's often better to store theme_config as JSONB on the resume itself.
-- But the user asked for `resume_template_configs` or similar. We will create it to store saved custom presets.
CREATE TABLE resume_theme_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL, -- e.g. "Minimal Dark Accent"
  template_id TEXT REFERENCES resume_templates(id),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: resumes (Updates previous implementations to tie everything together)
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  track_id UUID REFERENCES career_tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ats_score INTEGER DEFAULT 0,
  template_id TEXT REFERENCES resume_templates(id),
  theme_config JSONB DEFAULT '{}'::jsonb, -- Store the active config right on the resume for quick rendering
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mock Data Insertion

-- 1. Insert Templates
INSERT INTO resume_templates (id, name, category, is_ats_friendly) VALUES
('velora-professional', 'Velora Professional', 'ATS Friendly', true),
('modern-minimalist', 'Modern Minimalist', 'Modern', true),
('dev-terminal', 'Dev Terminal', 'Developer', false);

-- 2. Insert Career Tracks (using a generic nil UUID for user_id for mock purposes)
INSERT INTO career_tracks (id, name, role, status, color) VALUES
('00000000-0000-0000-0000-000000000001', 'SDE Track', 'Backend / Fullstack Engineer', 'Active', 'blue'),
('00000000-0000-0000-0000-000000000002', 'Data Analyst', 'Data Science / Analytics', 'Active', 'emerald'),
('00000000-0000-0000-0000-000000000003', 'Product Manager', 'Technical PM', 'Needs Optimization', 'orange');

-- 3. Insert Resumes
-- We use the exact mock content structure inside the JSONB field.
INSERT INTO resumes (id, track_id, name, ats_score, template_id, theme_config, content) VALUES
(
  '11111111-1111-1111-1111-111111111111', 
  '00000000-0000-0000-0000-000000000001', 
  'Backend Engineer Core', 
  94, 
  'velora-professional', 
  '{"typography": {"fontFamily": "Inter", "fontSize": "14px"}, "colors": {"accent": "#3b82f6"}}'::jsonb,
  '{
    "personalInfo": {
      "fullName": "Alex Developer",
      "email": "alex@example.com",
      "phone": "(555) 123-4567",
      "location": "San Francisco, CA",
      "summary": "Passionate software engineer with 5+ years of experience."
    },
    "experience": [],
    "education": [],
    "projects": [],
    "skills": []
  }'::jsonb
),
(
  '22222222-2222-2222-2222-222222222222', 
  '00000000-0000-0000-0000-000000000002', 
  'Data Analyst Resume', 
  88, 
  'modern-minimalist', 
  '{"typography": {"fontFamily": "Roboto", "fontSize": "13px"}, "colors": {"accent": "#10b981"}}'::jsonb,
  '{
    "personalInfo": {
      "fullName": "Alex Developer",
      "email": "alex@example.com",
      "phone": "(555) 123-4567",
      "location": "Austin, TX",
      "summary": "Data Analyst with strong SQL skills."
    },
    "experience": [],
    "education": [],
    "projects": [],
    "skills": []
  }'::jsonb
);

-- RLS Policies
ALTER TABLE career_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_theme_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Note: In a real app, Policies would restrict SELECT/INSERT/UPDATE to auth.uid() = user_id.
-- For templates, they are globally readable.
CREATE POLICY "Templates are viewable by everyone" ON resume_templates FOR SELECT USING (true);
