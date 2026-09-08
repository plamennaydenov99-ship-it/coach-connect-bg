ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.club_profiles
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.coach_profiles
  ADD CONSTRAINT coach_profiles_application_status_check
  CHECK (application_status IN ('pending','approved','rejected'));

ALTER TABLE public.club_profiles
  ADD CONSTRAINT club_profiles_application_status_check
  CHECK (application_status IN ('pending','approved','rejected'));

UPDATE public.coach_profiles SET application_status = CASE WHEN verified THEN 'approved' ELSE 'pending' END;
UPDATE public.club_profiles SET application_status = CASE WHEN verified THEN 'approved' ELSE 'pending' END;

CREATE POLICY "Owner can create own coach profile"
  ON public.coach_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner can create own club profile"
  ON public.club_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);