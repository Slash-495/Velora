-- Migration: Resume Versioning and Sharing

-- Table: resume_versions
-- Stores read-only snapshots of a resume at a specific point in time.
CREATE TABLE resume_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ats_score INTEGER DEFAULT 0,
  template_id TEXT REFERENCES resume_templates(id),
  theme_config JSONB DEFAULT '{}'::jsonb,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: shared_resumes
-- Manages public shareable links for a specific resume.
CREATE TABLE shared_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- acts as the shareId
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resumes ENABLE ROW LEVEL SECURITY;

-- Note: Policies for shared_resumes should allow public read access if is_active = true
CREATE POLICY "Public can view active shared resumes" 
ON shared_resumes FOR SELECT 
USING (is_active = true);

-- Allow public access to the linked resume if it's joined through an active shared_resume
-- (This would typically be handled in the API layer or with a secure RPC/View in Supabase)
