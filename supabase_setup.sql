-- ─────────────────────────────────────────────────────────────
-- VigilAI · Supabase Table Setup
-- Run this in your Supabase SQL Editor:
-- https://app.supabase.com → Your Project → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- 1. Create the subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text        NOT NULL,
  website_url     text        NOT NULL,
  email_provider  text        NOT NULL CHECK (email_provider IN ('Gmail', 'Outlook', 'Custom')),
  tech_stack      text[]      NOT NULL DEFAULT '{}',
  team_size       text        NOT NULL CHECK (team_size IN ('1-5', '6-20', '21-50', '50+')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous inserts (the onboarding form uses the anon key)
CREATE POLICY "Allow anon inserts"
  ON public.subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Only authenticated users (you) can read the data
CREATE POLICY "Allow authenticated reads"
  ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Helpful index for time-ordered queries
CREATE INDEX IF NOT EXISTS subscribers_created_at_idx
  ON public.subscribers (created_at DESC);
