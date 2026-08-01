-- Migration: Performance Indexes

-- 1. Job Applications Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- 2. Resume Tracker & Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_resume_reviews_user_id ON resume_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_resume_id ON resume_reviews(resume_id);

-- 3. Cover Letters Indexes
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON cover_letters(resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_ai_suggestions_letter_id ON cover_letter_ai_suggestions(letter_id);

-- 4. Company Research Indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_company_notes_company_id ON company_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_notes_user_id ON company_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_company_resources_company_id ON company_resources(company_id);
CREATE INDEX IF NOT EXISTS idx_company_resources_user_id ON company_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_insights_company_id ON company_ai_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_insights_user_id ON company_ai_insights(user_id);

-- 5. Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_user_id ON analytics_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
