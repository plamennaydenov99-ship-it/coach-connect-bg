
-- Enum
CREATE TYPE public.app_role AS ENUM ('athlete', 'coach', 'club');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- coach_profiles
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  sport TEXT,
  specialisms TEXT[] NOT NULL DEFAULT '{}',
  price_per_session NUMERIC,
  discount_pct INT NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
  years_experience INT,
  level TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_profiles TO authenticated;
GRANT SELECT ON public.coach_profiles TO anon;
GRANT ALL ON public.coach_profiles TO service_role;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER coach_profiles_set_updated_at BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX coach_profiles_verified_idx ON public.coach_profiles(verified) WHERE verified = true;

-- club_profiles
CREATE TABLE public.club_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  sport TEXT,
  city TEXT,
  about TEXT,
  hours TEXT,
  programs JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_profiles TO authenticated;
GRANT SELECT ON public.club_profiles TO anon;
GRANT ALL ON public.club_profiles TO service_role;
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER club_profiles_set_updated_at BEFORE UPDATE ON public.club_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX club_profiles_verified_idx ON public.club_profiles(verified) WHERE verified = true;

-- Security-definer helper: is this profile publicly visible?
CREATE OR REPLACE FUNCTION public.is_public_profile(_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.coach_profiles WHERE id = _id AND verified = true)
      OR EXISTS (SELECT 1 FROM public.club_profiles  WHERE id = _id AND verified = true);
$$;

-- RLS: profiles
CREATE POLICY "Owner can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public can view profiles linked to verified coach/club"
  ON public.profiles FOR SELECT
  USING (public.is_public_profile(id));

CREATE POLICY "Owner can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: coach_profiles
CREATE POLICY "Owner can view own coach profile"
  ON public.coach_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public can view verified coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (verified = true);

CREATE POLICY "Owner can update own coach profile"
  ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: club_profiles
CREATE POLICY "Owner can view own club profile"
  ON public.club_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public can view verified club profiles"
  ON public.club_profiles FOR SELECT
  USING (verified = true);

CREATE POLICY "Owner can update own club profile"
  ON public.club_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- New user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::public.app_role;

  INSERT INTO public.profiles (id, role, full_name, city, language)
  VALUES (
    NEW.id,
    _role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  IF _role = 'coach' THEN
    INSERT INTO public.coach_profiles (id) VALUES (NEW.id);
  ELSIF _role = 'club' THEN
    INSERT INTO public.club_profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
