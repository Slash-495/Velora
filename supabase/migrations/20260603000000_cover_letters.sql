-- Migration: AI Cover Letter Studio

-- Table: cover_letters
CREATE TABLE cover_letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- References auth.users
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- e.g., "Google SWE Version"
  company_name TEXT,
  role_name TEXT,
  job_description TEXT,
  tone TEXT DEFAULT 'Professional',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: cover_letter_ai_suggestions
CREATE TABLE cover_letter_ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  original_text TEXT,
  improved_text TEXT,
  type TEXT NOT NULL, -- 'grammar', 'impact', 'tailoring', 'tone'
  status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mock Data Insertion
INSERT INTO cover_letters (id, name, company_name, role_name, tone, content) VALUES
(
  '33333333-3333-3333-3333-333333333333', 
  'Startup Frontend Role', 
  'TechFlow', 
  'Frontend Engineer', 
  'Startup-Friendly', 
  'Dear Hiring Manager,

I am writing to express my strong interest in the Frontend Engineer position at TechFlow. With my extensive background in modern React architectures and a passion for building intuitive user interfaces, I am excited about the opportunity to contribute to your rapidly growing platform.

In my recent roles, I have consistently led initiatives that improved performance and user engagement. I thrive in fast-paced startup environments where I can take ownership of complex technical challenges.

I look forward to discussing how my technical skills and product-focused mindset align with TechFlow''s vision.

Best regards,
John Doe'
);

INSERT INTO cover_letter_ai_suggestions (cover_letter_id, suggestion_text, original_text, improved_text, type) VALUES
(
  '33333333-3333-3333-3333-333333333333',
  'Quantify your impact to make this stronger.',
  'In my recent roles, I have consistently led initiatives that improved performance and user engagement.',
  'In my recent roles, I led a frontend optimization initiative that reduced load times by 40% and boosted user engagement metrics by 25%.',
  'impact'
);

-- RLS Policies
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letter_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Note: In a real app, restrict SELECT/INSERT/UPDATE to auth.uid() = user_id
