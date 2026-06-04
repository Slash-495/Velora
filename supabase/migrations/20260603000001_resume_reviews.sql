-- Migration: AI Resume Reviews

-- Table: resume_reviews
CREATE TABLE resume_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  
  -- Scores
  overall_score INTEGER NOT NULL,
  ats_score INTEGER NOT NULL,
  recruiter_score INTEGER NOT NULL,
  technical_score INTEGER NOT NULL,
  readability_score INTEGER NOT NULL,
  
  -- Coach Insights
  career_insights TEXT NOT NULL,
  
  -- JSON data for arrays/complex structures to avoid over-normalizing
  section_analysis JSONB NOT NULL DEFAULT '[]'::jsonb, 
  -- Format: [{ section: 'Projects', strengths: [], weaknesses: [], recommendations: [] }]
  
  skill_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{ skill: 'Redis', context: 'Missing caching experience' }]
  
  roadmap JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Format: { thisWeek: [], thisMonth: [], nextQuarter: [] }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE resume_reviews ENABLE ROW LEVEL SECURITY;
-- (Add policies in production)
