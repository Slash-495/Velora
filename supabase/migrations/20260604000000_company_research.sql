-- Migration: Company Research Workspace

-- Table: companies
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  overview TEXT,
  website TEXT,
  careers_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: company_notes
CREATE TABLE company_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('research', 'interview', 'recruiter', 'general')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: company_resources
CREATE TABLE company_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: company_ai_insights
CREATE TABLE company_ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Format: { techStack: [], culturalFocus: [], commonTopics: [], redFlags: [] }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_ai_insights ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own companies" ON companies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own company notes" ON company_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own company resources" ON company_resources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own company AI insights" ON company_ai_insights FOR ALL USING (auth.uid() = user_id);
