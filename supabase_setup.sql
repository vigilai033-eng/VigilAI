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
  email           text        NOT NULL,
  team_emails     text[]      NOT NULL DEFAULT '{}',
  notify_weekly   boolean     NOT NULL DEFAULT true,
  notify_breaches boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous/authenticated inserts
CREATE POLICY "Allow anon inserts"
  ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

-- 4. Only authenticated users (you) can read their own data
CREATE POLICY "Allow authenticated reads"
  ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated updates"
  ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow authenticated deletes"
  ON public.subscribers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 5. Helpful index for time-ordered queries
CREATE INDEX IF NOT EXISTS subscribers_created_at_idx
  ON public.subscribers (created_at DESC);


-- IF YOU ALREADY CREATED THE TABLE, RUN THESE ALTER COMMANDS:
-- ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS team_emails text[] NOT NULL DEFAULT '{}';
-- ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS notify_weekly boolean NOT NULL DEFAULT true;
-- ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS notify_breaches boolean NOT NULL DEFAULT true;
-- 
-- CREATE POLICY "Allow authenticated updates" ON public.subscribers FOR UPDATE TO authenticated USING (auth.uid() = id);
-- CREATE POLICY "Allow authenticated deletes" ON public.subscribers FOR DELETE TO authenticated USING (auth.uid() = id);
