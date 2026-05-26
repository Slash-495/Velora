-- Migration: Job Applications and Tracking Tables

-- Table: job_applications
-- Stores the job applications submitted or tracked by the user
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Assuming integration with auth.users
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  job_description TEXT, -- Store the full JD for AI integration
  resume_id UUID, -- References the resume used (if any)
  status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'applied', 'oa', 'interview', 'final_round', 'offer', 'rejected')),
  location TEXT,
  salary_range TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: application_timeline
-- Stores the history of status changes and significant events for an application
CREATE TABLE application_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'note_added', 'interview_scheduled', 'oa_received')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: recruiter_contacts
-- Stores recruiter or contact information associated with an application
CREATE TABLE recruiter_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_application_timeline_app_id ON application_timeline(application_id);
CREATE INDEX idx_recruiter_contacts_app_id ON recruiter_contacts(application_id);

-- Add Row Level Security (RLS)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_contacts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Users can only see and manage their own data)
CREATE POLICY "Users can manage their own job applications"
  ON job_applications
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage timeline via application owner"
  ON application_timeline
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_applications.id = application_timeline.application_id
      AND job_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recruiter contacts via application owner"
  ON recruiter_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_applications.id = recruiter_contacts.application_id
      AND job_applications.user_id = auth.uid()
    )
  );
