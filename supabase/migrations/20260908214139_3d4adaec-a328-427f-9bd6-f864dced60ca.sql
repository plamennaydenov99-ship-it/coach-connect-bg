ALTER TABLE public.coach_profiles DROP CONSTRAINT IF EXISTS coach_profiles_application_status_check;

ALTER TABLE public.coach_profiles
  ALTER COLUMN application_status SET DEFAULT 'draft';

ALTER TABLE public.coach_profiles
  ADD CONSTRAINT coach_profiles_application_status_check
  CHECK (application_status IN ('draft','pending','approved','rejected'));

ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS price_per_group_session numeric;