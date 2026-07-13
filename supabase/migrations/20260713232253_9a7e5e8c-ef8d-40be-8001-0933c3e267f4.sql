
-- athlete_profiles
CREATE TABLE public.athlete_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  height_cm INTEGER,
  weight_kg NUMERIC(5,2),
  sports TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_profiles TO authenticated;
GRANT ALL ON public.athlete_profiles TO service_role;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes read own profile" ON public.athlete_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Athletes insert own profile" ON public.athlete_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Athletes update own profile" ON public.athlete_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Athletes delete own profile" ON public.athlete_profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER athlete_profiles_set_updated_at
  BEFORE UPDATE ON public.athlete_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('coach', 'event')),
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes read own bookmarks" ON public.bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "Athletes create own bookmarks" ON public.bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Athletes delete own bookmarks" ON public.bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = athlete_id);

CREATE INDEX bookmarks_athlete_idx ON public.bookmarks(athlete_id);
