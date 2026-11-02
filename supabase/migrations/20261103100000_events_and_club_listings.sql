-- Real data for Lokka: events (and camps), club listings that can exist before a club joins, claims, reports.
-- Every row carries a source link. Public can read only what is published. Writes go through admins.

-- ───────────────────────── events (camps are kind = 'camp') ─────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  kind            text NOT NULL DEFAULT 'tournament' CHECK (kind IN ('race','tournament','open_day','clinic','workshop','camp')),
  sport           text,
  starts_on       date NOT NULL,
  ends_on         date,
  recurrence      text,
  venue           text,
  district        text,
  address         text,
  lat             double precision,
  lng             double precision,
  price_text      text,
  level           text,
  age_group       text,
  registration_url text CHECK (registration_url IS NULL OR registration_url ~ '^https?://'),
  source_url      text NOT NULL CHECK (source_url ~ '^https?://'),
  source_name     text,
  summary         text CHECK (summary IS NULL OR char_length(summary) <= 400),
  image_url       text CHECK (image_url IS NULL OR image_url ~ '^https?://'),
  organiser_name  text,
  owner_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','cancelled')),
  last_checked_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS events_status_start_idx ON public.events (status, starts_on);
CREATE INDEX IF NOT EXISTS events_sport_idx ON public.events (sport);
DROP TRIGGER IF EXISTS events_set_updated_at ON public.events;
CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads upcoming published events" ON public.events;
CREATE POLICY "Public reads upcoming published events" ON public.events
  FOR SELECT TO anon, authenticated USING (status = 'published' AND coalesce(ends_on, starts_on) >= current_date);
DROP POLICY IF EXISTS "Owners read own events" ON public.events;
CREATE POLICY "Owners read own events" ON public.events
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
REVOKE ALL ON public.events FROM anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;   -- RLS limits writes to admins
GRANT ALL ON public.events TO service_role;

-- ───────────────────────── club listings (no login needed) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.club_listings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,
  name               text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  sports             text[] NOT NULL DEFAULT '{}',
  city               text NOT NULL DEFAULT 'Sofia',
  district           text,
  address            text,
  lat                double precision,
  lng                double precision,
  website            text CHECK (website IS NULL OR website ~ '^https?://'),
  source_name        text,
  source_url         text CHECK (source_url IS NULL OR source_url ~ '^https?://'),
  osm_id             text,
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden','removed')),
  claimed_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_checked_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS club_listings_osm_idx ON public.club_listings (osm_id) WHERE osm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS club_listings_sports_idx ON public.club_listings USING gin (sports);
DROP TRIGGER IF EXISTS club_listings_set_updated_at ON public.club_listings;
CREATE TRIGGER club_listings_set_updated_at BEFORE UPDATE ON public.club_listings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.club_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads published club listings" ON public.club_listings;
CREATE POLICY "Public reads published club listings" ON public.club_listings
  FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "Admins manage club listings" ON public.club_listings;
CREATE POLICY "Admins manage club listings" ON public.club_listings
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
REVOKE ALL ON public.club_listings FROM anon, authenticated;
GRANT SELECT ON public.club_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.club_listings TO authenticated;
GRANT ALL ON public.club_listings TO service_role;

-- ───────────────────────── claims ─────────────────────────
CREATE TABLE IF NOT EXISTS public.club_claims (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.club_listings(id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     text CHECK (message IS NULL OR char_length(message) <= 1000),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  UNIQUE (listing_id, claimant_id)
);
ALTER TABLE public.club_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club owners read own claims" ON public.club_claims;
CREATE POLICY "Club owners read own claims" ON public.club_claims
  FOR SELECT TO authenticated USING (claimant_id = auth.uid());
DROP POLICY IF EXISTS "Club owners file claims" ON public.club_claims;
CREATE POLICY "Club owners file claims" ON public.club_claims
  FOR INSERT TO authenticated WITH CHECK (
    claimant_id = auth.uid() AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL
    AND EXISTS (SELECT 1 FROM public.club_profiles c WHERE c.id = auth.uid())
  );
DROP POLICY IF EXISTS "Admins manage claims" ON public.club_claims;
CREATE POLICY "Admins manage claims" ON public.club_claims
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
REVOKE ALL ON public.club_claims FROM anon, authenticated;
GRANT SELECT, INSERT ON public.club_claims TO authenticated;
GRANT UPDATE, DELETE ON public.club_claims TO authenticated;   -- RLS limits these to admins
GRANT ALL ON public.club_claims TO service_role;

-- ───────────────────────── removal and correction requests (anyone can file, only admins read) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('club','event')),
  target_id   uuid NOT NULL,
  reason      text NOT NULL CHECK (reason IN ('removal','correction')),
  contact     text CHECK (contact IS NULL OR char_length(contact) <= 200),
  message     text CHECK (message IS NULL OR char_length(message) <= 1000),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can file a report" ON public.listing_reports;
CREATE POLICY "Anyone can file a report" ON public.listing_reports
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'open');
DROP POLICY IF EXISTS "Admins manage reports" ON public.listing_reports;
CREATE POLICY "Admins manage reports" ON public.listing_reports
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
REVOKE ALL ON public.listing_reports FROM anon, authenticated;
GRANT INSERT ON public.listing_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.listing_reports TO authenticated;   -- RLS limits these to admins
GRANT ALL ON public.listing_reports TO service_role;

-- ───────────────────────── admin import: events (dry run first, then for real) ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_import_events(_rows jsonb, _dry boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r jsonb; i int := 0; ins int := 0; upd int := 0; errs jsonb := '[]'::jsonb; v_slug text; v_exists boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'rows must be a list'; END IF;
  IF jsonb_array_length(_rows) > 500 THEN RAISE EXCEPTION 'at most 500 rows per import'; END IF;

  BEGIN
    FOR r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
      i := i + 1;
      BEGIN
        v_slug := nullif(trim(r->>'slug'), '');
        IF v_slug IS NULL THEN RAISE EXCEPTION 'slug is missing'; END IF;
        SELECT EXISTS (SELECT 1 FROM public.events WHERE slug = v_slug) INTO v_exists;
        INSERT INTO public.events AS e (slug, title, kind, sport, starts_on, ends_on, recurrence, venue, district, address, lat, lng,
            price_text, level, age_group, registration_url, source_url, source_name, summary, organiser_name, status, last_checked_at)
        VALUES (v_slug, trim(r->>'title'), coalesce(nullif(r->>'kind', ''), 'tournament'), nullif(r->>'sport', ''),
            (r->>'starts_on')::date, nullif(r->>'ends_on', '')::date, nullif(r->>'recurrence', ''), nullif(r->>'venue', ''),
            nullif(r->>'district', ''), nullif(r->>'address', ''), nullif(r->>'lat', '')::double precision, nullif(r->>'lng', '')::double precision,
            nullif(r->>'price_text', ''), nullif(r->>'level', ''), nullif(r->>'age_group', ''), nullif(r->>'registration_url', ''),
            r->>'source_url', nullif(r->>'source_name', ''), nullif(r->>'summary', ''), nullif(r->>'organiser_name', ''),
            coalesce(nullif(r->>'status', ''), 'draft'), coalesce(nullif(r->>'last_checked_at', '')::timestamptz, now()))
        ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title, kind = EXCLUDED.kind, sport = EXCLUDED.sport, starts_on = EXCLUDED.starts_on, ends_on = EXCLUDED.ends_on,
            recurrence = EXCLUDED.recurrence, venue = EXCLUDED.venue, district = EXCLUDED.district, address = EXCLUDED.address,
            lat = EXCLUDED.lat, lng = EXCLUDED.lng, price_text = EXCLUDED.price_text, level = EXCLUDED.level, age_group = EXCLUDED.age_group,
            registration_url = EXCLUDED.registration_url, source_url = EXCLUDED.source_url, source_name = EXCLUDED.source_name,
            summary = EXCLUDED.summary, organiser_name = EXCLUDED.organiser_name, last_checked_at = EXCLUDED.last_checked_at,
            status = CASE WHEN nullif(r->>'status', '') IS NULL THEN e.status ELSE EXCLUDED.status END;
        IF v_exists THEN upd := upd + 1; ELSE ins := ins + 1; END IF;
      EXCEPTION WHEN OTHERS THEN
        errs := errs || jsonb_build_object('row', i, 'slug', r->>'slug', 'message', SQLERRM);
      END;
    END LOOP;
    IF _dry THEN RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'dry run'; END IF;
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;   -- a dry run undoes everything but keeps the counts
  END;

  IF NOT _dry THEN
    INSERT INTO public.admin_audit_log (admin_id, action, target_label, detail)
    VALUES (auth.uid(), 'import_events', 'events', jsonb_build_object('inserted', ins, 'updated', upd, 'errors', jsonb_array_length(errs)));
  END IF;
  RETURN jsonb_build_object('dry', _dry, 'inserted', ins, 'updated', upd, 'errors', errs);
END $$;

-- ───────────────────────── admin import: club listings ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_import_clubs(_rows jsonb, _dry boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  r jsonb; i int := 0; ins int := 0; upd int := 0; errs jsonb := '[]'::jsonb; v_slug text; v_exists boolean; v_sports text[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF jsonb_typeof(_rows) <> 'array' THEN RAISE EXCEPTION 'rows must be a list'; END IF;
  IF jsonb_array_length(_rows) > 500 THEN RAISE EXCEPTION 'at most 500 rows per import'; END IF;

  BEGIN
    FOR r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
      i := i + 1;
      BEGIN
        v_slug := nullif(trim(r->>'slug'), '');
        IF v_slug IS NULL THEN RAISE EXCEPTION 'slug is missing'; END IF;
        v_sports := CASE WHEN jsonb_typeof(r->'sports') = 'array' THEN ARRAY(SELECT lower(jsonb_array_elements_text(r->'sports'))) ELSE '{}'::text[] END;
        SELECT EXISTS (SELECT 1 FROM public.club_listings WHERE slug = v_slug) INTO v_exists;
        INSERT INTO public.club_listings AS c (slug, name, sports, city, district, address, lat, lng, website, source_name, source_url, osm_id, status, last_checked_at)
        VALUES (v_slug, trim(r->>'name'), v_sports, coalesce(nullif(r->>'city', ''), 'Sofia'), nullif(r->>'district', ''), nullif(r->>'address', ''),
            nullif(r->>'lat', '')::double precision, nullif(r->>'lng', '')::double precision, nullif(r->>'website', ''),
            nullif(r->>'source_name', ''), nullif(r->>'source_url', ''), nullif(r->>'osm_id', ''),
            coalesce(nullif(r->>'status', ''), 'draft'), coalesce(nullif(r->>'last_checked_at', '')::timestamptz, now()))
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name, sports = EXCLUDED.sports, city = EXCLUDED.city, district = EXCLUDED.district, address = EXCLUDED.address,
            lat = EXCLUDED.lat, lng = EXCLUDED.lng, website = EXCLUDED.website, source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url,
            osm_id = EXCLUDED.osm_id, last_checked_at = EXCLUDED.last_checked_at,
            status = CASE WHEN nullif(r->>'status', '') IS NULL THEN c.status ELSE EXCLUDED.status END;
        IF v_exists THEN upd := upd + 1; ELSE ins := ins + 1; END IF;
      EXCEPTION WHEN OTHERS THEN
        errs := errs || jsonb_build_object('row', i, 'slug', r->>'slug', 'message', SQLERRM);
      END;
    END LOOP;
    IF _dry THEN RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'dry run'; END IF;
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;

  IF NOT _dry THEN
    INSERT INTO public.admin_audit_log (admin_id, action, target_label, detail)
    VALUES (auth.uid(), 'import_clubs', 'club_listings', jsonb_build_object('inserted', ins, 'updated', upd, 'errors', jsonb_array_length(errs)));
  END IF;
  RETURN jsonb_build_object('dry', _dry, 'inserted', ins, 'updated', upd, 'errors', errs);
END $$;

-- ───────────────────────── admin: approve or reject a club application, and resolve a claim ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_review_club(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'status must be approved or rejected'; END IF;
  UPDATE public.club_profiles SET application_status = _status, reviewed_at = now(), reviewed_by = auth.uid() WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'club not found'; END IF;
  INSERT INTO public.admin_audit_log (admin_id, action, target_id, target_label, detail)
  VALUES (auth.uid(), 'review_club', _id, _status, jsonb_build_object('status', _status));
END $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_claim(_claim uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.club_claims; l public.club_listings;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT * INTO c FROM public.club_claims WHERE id = _claim;
  IF NOT FOUND THEN RAISE EXCEPTION 'claim not found'; END IF;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'claim was already handled'; END IF;
  SELECT * INTO l FROM public.club_listings WHERE id = c.listing_id;

  IF _approve THEN
    UPDATE public.club_listings SET claimed_profile_id = c.claimant_id WHERE id = c.listing_id;
    UPDATE public.club_profiles SET application_status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() WHERE id = c.claimant_id;
    UPDATE public.club_claims SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid()
      WHERE listing_id = c.listing_id AND status = 'pending' AND id <> c.id;
  END IF;
  UPDATE public.club_claims SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, reviewed_at = now(), reviewed_by = auth.uid() WHERE id = c.id;
  INSERT INTO public.admin_audit_log (admin_id, action, target_id, target_label, detail)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'approve_claim' ELSE 'reject_claim' END, c.listing_id, l.name, jsonb_build_object('claimant', c.claimant_id));
END $$;

-- ───────────────────────── overview: add the new queues ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT jsonb_build_object(
    'people', jsonb_build_object(
      'total', (SELECT count(*) FROM public.profiles),
      'athletes', (SELECT count(*) FROM public.profiles WHERE role = 'athlete'),
      'coaches', (SELECT count(*) FROM public.profiles WHERE role = 'coach'),
      'clubs', (SELECT count(*) FROM public.profiles WHERE role = 'club'),
      'new_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
      'unconfirmed', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL)),
    'waiting', jsonb_build_object(
      'coach_apps', (SELECT count(*) FROM public.coach_profiles WHERE application_status = 'pending'),
      'club_apps', (SELECT count(*) FROM public.club_profiles WHERE application_status = 'pending'),
      'certificates', (SELECT count(*) FROM public.coach_certificates WHERE status = 'pending'),
      'boosts', (SELECT count(*) FROM public.ad_campaigns WHERE status = 'in_review'),
      'events_pending', (SELECT count(*) FROM public.events WHERE status = 'pending'),
      'club_claims', (SELECT count(*) FROM public.club_claims WHERE status = 'pending'),
      'reports', (SELECT count(*) FROM public.listing_reports WHERE status = 'open')),
    'content', jsonb_build_object(
      'events_live', (SELECT count(*) FROM public.events WHERE status = 'published' AND coalesce(ends_on, starts_on) >= current_date),
      'events_draft', (SELECT count(*) FROM public.events WHERE status IN ('draft', 'pending')),
      'events_stale', (SELECT count(*) FROM public.events WHERE status = 'published' AND (last_checked_at IS NULL OR last_checked_at < now() - interval '30 days')),
      'clubs_live', (SELECT count(*) FROM public.club_listings WHERE status = 'published'),
      'clubs_draft', (SELECT count(*) FROM public.club_listings WHERE status = 'draft')),
    'activity', jsonb_build_object(
      'upcoming_sessions', (SELECT count(*) FROM public.coach_sessions WHERE is_public AND status = 'scheduled' AND starts_at > now()),
      'bookings_7d', (SELECT count(*) FROM public.bookings WHERE created_at > now() - interval '7 days'),
      'spot_requests_7d', (SELECT count(*) FROM public.spot_requests WHERE created_at > now() - interval '7 days'),
      'messages_7d', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '7 days'),
      'profile_views_7d', (SELECT count(*) FROM public.profile_views WHERE created_at > now() - interval '7 days')),
    'signups_14d', (SELECT coalesce(jsonb_agg(jsonb_build_object('d', x.d, 'n', x.n) ORDER BY x.d), '[]'::jsonb)
      FROM (SELECT g::date AS d, (SELECT count(*) FROM public.profiles WHERE created_at::date = g::date) AS n
            FROM generate_series(current_date - 13, current_date, interval '1 day') g) x)
  ) INTO r;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_import_events(jsonb, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_import_clubs(jsonb, boolean)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_review_club(uuid, text)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_claim(uuid, boolean)  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_import_events(jsonb, boolean) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_import_clubs(jsonb, boolean)  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_review_club(uuid, text)       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_resolve_claim(uuid, boolean)  TO authenticated;
