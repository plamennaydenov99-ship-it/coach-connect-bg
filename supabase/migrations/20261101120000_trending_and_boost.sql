-- Trending, waitlist and Boost (promoted places).
-- Additive changes only, plus one security fix (section 0).

-- 0. Security: the two public views must be read-only for the app.
-- They are owner-privileged and auto-updatable, so write grants on them let a
-- signed-in user change rows in the underlying tables and skip row-level security.
REVOKE INSERT, UPDATE, DELETE ON public.public_sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.public_certificates FROM anon, authenticated;

-- 1. Session extras ---------------------------------------------------------
ALTER TABLE public.coach_sessions ADD COLUMN IF NOT EXISTS is_popup boolean NOT NULL DEFAULT false;
ALTER TABLE public.coach_sessions ADD COLUMN IF NOT EXISTS join_mode text NOT NULL DEFAULT 'request';
DO $$ BEGIN
  ALTER TABLE public.coach_sessions ADD CONSTRAINT coach_sessions_join_mode_check CHECK (join_mode IN ('request', 'instant'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- A public session created less than 24 hours before it starts is a pop-up.
CREATE OR REPLACE FUNCTION public.tg_session_popup_flag() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_public AND NEW.kind <> 'hire' AND NEW.series_id IS NULL AND NEW.starts_at - now() < interval '24 hours' THEN
    NEW.is_popup := true;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS session_popup_flag ON public.coach_sessions;
CREATE TRIGGER session_popup_flag BEFORE INSERT ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_session_popup_flag();

-- Same columns as before, three new ones at the end.
CREATE OR REPLACE VIEW public.public_sessions WITH (security_barrier = true) AS
 SELECT id,
    coach_id AS owner_id,
    title,
    sport,
    led_by,
    location,
    starts_at,
    ends_at,
    capacity,
    GREATEST(COALESCE(capacity, 0) - (( SELECT count(*) FROM public.session_attendees a
          WHERE a.session_id = s.id AND (a.status = ANY (ARRAY['booked'::text, 'attended'::text])))), 0::bigint)::integer AS spots_left,
    is_popup,
    price,
    join_mode
   FROM public.coach_sessions s
  WHERE is_public AND starts_at > now() AND status = 'scheduled'::text AND ((EXISTS ( SELECT 1
           FROM public.coach_profiles p
          WHERE p.id = s.coach_id AND p.application_status = 'approved'::text)) OR (EXISTS ( SELECT 1
           FROM public.club_profiles p
          WHERE p.id = s.coach_id AND p.application_status = 'approved'::text)));
REVOKE INSERT, UPDATE, DELETE ON public.public_sessions FROM anon, authenticated;

-- 2. Waitlist ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'claimed', 'left')),
  offered_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, athlete_id)
);
ALTER TABLE public.session_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_waitlist FROM anon, authenticated;
GRANT SELECT ON public.session_waitlist TO authenticated;
DROP POLICY IF EXISTS "Athlete reads own waitlist rows" ON public.session_waitlist;
CREATE POLICY "Athlete reads own waitlist rows" ON public.session_waitlist FOR SELECT TO authenticated USING (athlete_id = auth.uid());
DROP POLICY IF EXISTS "Owner reads waitlist for own sessions" ON public.session_waitlist;
CREATE POLICY "Owner reads waitlist for own sessions" ON public.session_waitlist FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_sessions s WHERE s.id = session_id AND s.coach_id = auth.uid()));

-- Internal: hand free places to the people waiting, in order, 30 minutes each.
CREATE OR REPLACE FUNCTION public.offer_waitlist(p_session uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.coach_sessions; v_free int; v_held int; v_n int;
BEGIN
  SELECT * INTO s FROM public.coach_sessions WHERE id = p_session;
  IF NOT FOUND OR s.capacity IS NULL OR s.status <> 'scheduled' OR s.starts_at <= now() THEN RETURN; END IF;
  UPDATE public.session_waitlist SET status = 'left', offered_until = NULL
    WHERE session_id = p_session AND status = 'offered' AND offered_until <= now();
  v_free := s.capacity - (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = p_session AND a.status IN ('booked', 'attended'));
  v_held := (SELECT count(*) FROM public.session_waitlist w WHERE w.session_id = p_session
              AND (w.status = 'offered' OR (w.status = 'claimed' AND w.offered_until > now() - interval '12 hours')));
  v_n := v_free - v_held;
  IF v_n > 0 THEN
    UPDATE public.session_waitlist SET status = 'offered', offered_until = now() + interval '30 minutes'
      WHERE id IN (SELECT id FROM public.session_waitlist WHERE session_id = p_session AND status = 'waiting' ORDER BY created_at LIMIT v_n);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.offer_waitlist(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_waitlist_on_capacity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.capacity IS NOT NULL AND (OLD.capacity IS NULL OR NEW.capacity > OLD.capacity) THEN
    PERFORM public.offer_waitlist(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS waitlist_on_capacity ON public.coach_sessions;
CREATE TRIGGER waitlist_on_capacity AFTER UPDATE OF capacity ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_waitlist_on_capacity();

CREATE OR REPLACE FUNCTION public.tg_waitlist_on_attendee() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM public.offer_waitlist(OLD.session_id);
  ELSIF OLD.status IN ('booked', 'attended') AND NEW.status NOT IN ('booked', 'attended') THEN PERFORM public.offer_waitlist(NEW.session_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS waitlist_on_attendee ON public.session_attendees;
CREATE TRIGGER waitlist_on_attendee AFTER UPDATE OF status OR DELETE ON public.session_attendees
  FOR EACH ROW EXECUTE FUNCTION public.tg_waitlist_on_attendee();

CREATE OR REPLACE FUNCTION public.join_waitlist(p_session uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.coach_sessions; v_me uuid := auth.uid(); v_pos int; v_mine timestamptz;
BEGIN
  IF v_me IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_me AND role = 'athlete') THEN
    RAISE EXCEPTION 'Only athletes can join a waitlist';
  END IF;
  SELECT * INTO s FROM public.coach_sessions WHERE id = p_session;
  IF NOT FOUND OR NOT s.is_public OR s.status <> 'scheduled' OR s.starts_at <= now() OR s.capacity IS NULL THEN
    RAISE EXCEPTION 'This session cannot take a waitlist';
  END IF;
  IF (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = s.id AND a.status IN ('booked', 'attended')) < s.capacity THEN
    RAISE EXCEPTION 'This session still has places';
  END IF;
  INSERT INTO public.session_waitlist (session_id, athlete_id) VALUES (s.id, v_me)
    ON CONFLICT (session_id, athlete_id) DO UPDATE SET status = 'waiting', offered_until = NULL, created_at = now()
    WHERE public.session_waitlist.status = 'left';
  SELECT created_at INTO v_mine FROM public.session_waitlist WHERE session_id = s.id AND athlete_id = v_me;
  SELECT count(*) INTO v_pos FROM public.session_waitlist w
    WHERE w.session_id = s.id AND w.status IN ('waiting', 'offered') AND w.created_at <= v_mine;
  RETURN v_pos;
END $$;

CREATE OR REPLACE FUNCTION public.leave_waitlist(p_session uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.session_waitlist SET status = 'left', offered_until = NULL
   WHERE session_id = p_session AND athlete_id = auth.uid() AND status IN ('waiting', 'offered');
$$;

CREATE OR REPLACE FUNCTION public.claim_waitlist(p_session uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  UPDATE public.session_waitlist SET status = 'claimed'
   WHERE session_id = p_session AND athlete_id = auth.uid() AND status = 'offered' AND offered_until > now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END $$;

-- 3. Activity log for views, impressions and clicks -------------------------
-- Reservations, requests and saves are read straight from their own tables.
CREATE TABLE IF NOT EXISTS public.engagement_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('view', 'impression', 'click', 'share')),
  target_type text NOT NULL CHECK (target_type IN ('session', 'coach', 'club', 'item', 'campaign')),
  target_id uuid NOT NULL,
  actor_id uuid,
  visitor_hash text NOT NULL,
  campaign_id uuid
);
CREATE INDEX IF NOT EXISTS engagement_events_target_idx ON public.engagement_events (target_type, target_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS engagement_events_visitor_idx ON public.engagement_events (visitor_hash, occurred_at DESC);
CREATE INDEX IF NOT EXISTS engagement_events_time_idx ON public.engagement_events (occurred_at);
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.engagement_events FROM anon, authenticated;

-- A new random salt each day, so visitors cannot be followed from one day to the next.
CREATE TABLE IF NOT EXISTS public.daily_salt (
  day date PRIMARY KEY,
  salt text NOT NULL DEFAULT md5(gen_random_uuid()::text || gen_random_uuid()::text)
);
ALTER TABLE public.daily_salt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.daily_salt FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_event(p_type text, p_target_type text, p_target_id uuid, p_campaign uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hdr json; v_ip text; v_ua text; v_salt text; v_vh text; v_me uuid := auth.uid();
BEGIN
  IF p_type NOT IN ('view', 'impression', 'click', 'share')
     OR p_target_type NOT IN ('session', 'coach', 'club', 'item', 'campaign')
     OR p_target_id IS NULL THEN RETURN; END IF;
  BEGIN v_hdr := current_setting('request.headers', true)::json; EXCEPTION WHEN OTHERS THEN v_hdr := '{}'::json; END;
  v_ip := coalesce(split_part(v_hdr->>'x-forwarded-for', ',', 1), '');
  v_ua := coalesce(v_hdr->>'user-agent', '');
  IF v_ua ~* '(bot|crawl|spider|headless|curl|python-requests)' THEN RETURN; END IF;
  INSERT INTO public.daily_salt (day) VALUES (current_date) ON CONFLICT DO NOTHING;
  SELECT salt INTO v_salt FROM public.daily_salt WHERE day = current_date;
  v_vh := md5(coalesce(v_me::text, v_ip || v_ua) || v_salt);
  IF (SELECT count(*) FROM public.engagement_events WHERE visitor_hash = v_vh AND occurred_at > now() - interval '1 hour') >= 200 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.engagement_events WHERE visitor_hash = v_vh AND event_type = p_type
             AND target_type = p_target_type AND target_id = p_target_id AND occurred_at > now() - interval '1 hour') THEN RETURN; END IF;
  IF v_me IS NOT NULL AND (
       (p_target_type IN ('coach', 'club') AND p_target_id = v_me)
       OR (p_target_type = 'session' AND EXISTS (SELECT 1 FROM public.coach_sessions WHERE id = p_target_id AND coach_id = v_me))
     ) THEN RETURN; END IF;
  INSERT INTO public.engagement_events (event_type, target_type, target_id, actor_id, visitor_hash, campaign_id)
    VALUES (p_type, p_target_type, p_target_id, v_me, v_vh, p_campaign);
  IF random() < 0.005 THEN DELETE FROM public.engagement_events WHERE occurred_at < now() - interval '90 days'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.track_event(text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_event(text, text, uuid, uuid) TO anon, authenticated;

-- 4. Promoted places --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  placement text NOT NULL CHECK (placement IN ('row', 'pick')),
  city text NOT NULL DEFAULT 'Sofia' CHECK (city IN ('Sofia', 'Nice', 'Monaco')),
  sport text,
  headline text CHECK (headline IS NULL OR char_length(headline) <= 80),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  price_eur numeric(8, 2) NOT NULL CHECK (price_eur >= 0),
  status text NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'approved', 'declined', 'paused')),
  payment text NOT NULL DEFAULT 'unpaid' CHECK (payment IN ('unpaid', 'invoiced', 'paid')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on)
);
CREATE INDEX IF NOT EXISTS ad_campaigns_serve_idx ON public.ad_campaigns (city, placement, status, starts_on, ends_on);
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ad_campaigns FROM anon, authenticated;
GRANT SELECT ON public.ad_campaigns TO authenticated;
DROP POLICY IF EXISTS "Advertiser reads own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertiser reads own campaigns" ON public.ad_campaigns FOR SELECT TO authenticated USING (advertiser_id = auth.uid());
DROP POLICY IF EXISTS "Admins read all campaigns" ON public.ad_campaigns;
CREATE POLICY "Admins read all campaigns" ON public.ad_campaigns FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DO $$ BEGIN
  ALTER TABLE public.engagement_events ADD CONSTRAINT engagement_events_campaign_fk FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sample prices: promoted row 9 euros a day, presenting place 49 euros a week (7 a day). Prices include VAT.
CREATE OR REPLACE FUNCTION public.create_campaign(p_session uuid, p_placement text, p_start date, p_days int, p_headline text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_me uuid := auth.uid(); s public.coach_sessions; v_end date; v_n int; v_price numeric; v_id uuid; v_city text; d date;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF NOT (EXISTS (SELECT 1 FROM public.coach_profiles p WHERE p.id = v_me AND p.application_status = 'approved')
       OR EXISTS (SELECT 1 FROM public.club_profiles p WHERE p.id = v_me AND p.application_status = 'approved')) THEN
    RAISE EXCEPTION 'Only approved coaches and clubs can promote a session';
  END IF;
  IF p_placement NOT IN ('row', 'pick') THEN RAISE EXCEPTION 'Unknown placement'; END IF;
  SELECT * INTO s FROM public.coach_sessions WHERE id = p_session;
  IF NOT FOUND OR s.coach_id <> v_me THEN RAISE EXCEPTION 'Choose one of your own sessions'; END IF;
  IF NOT s.is_public OR s.status <> 'scheduled' OR s.starts_at <= now() OR s.capacity IS NULL THEN
    RAISE EXCEPTION 'Only public, upcoming group sessions can be promoted';
  END IF;
  IF s.capacity - (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = s.id AND a.status IN ('booked', 'attended')) <= 0 THEN
    RAISE EXCEPTION 'This session is full. Add places or a second group first';
  END IF;
  IF p_start < current_date THEN RAISE EXCEPTION 'The start date is in the past'; END IF;
  v_n := CASE WHEN p_placement = 'pick' THEN least(greatest(p_days, 1), 4) * 7 ELSE least(greatest(p_days, 1), 14) END;
  v_end := least(p_start + v_n - 1, (s.starts_at AT TIME ZONE 'Europe/Sofia')::date);
  IF v_end < p_start THEN RAISE EXCEPTION 'The session starts before the promotion could run'; END IF;
  v_n := (v_end - p_start) + 1;
  v_price := CASE WHEN p_placement = 'pick' THEN 7 ELSE 9 END * v_n;
  SELECT coalesce(nullif(split_part(city, ',', 1), ''), 'Sofia') INTO v_city FROM public.profiles WHERE id = v_me;
  IF v_city NOT IN ('Sofia', 'Nice', 'Monaco') THEN v_city := 'Sofia'; END IF;
  IF p_placement = 'pick' THEN
    IF EXISTS (SELECT 1 FROM public.ad_campaigns c WHERE c.city = v_city AND c.placement = 'pick' AND c.status IN ('in_review', 'approved')
               AND c.starts_on <= v_end AND c.ends_on >= p_start) THEN
      RAISE EXCEPTION 'The presenting place is already taken for those dates';
    END IF;
  ELSE
    FOR d IN SELECT generate_series(p_start, v_end, interval '1 day')::date LOOP
      IF (SELECT count(*) FROM public.ad_campaigns c WHERE c.city = v_city AND c.placement = 'row' AND c.status IN ('in_review', 'approved')
          AND c.starts_on <= d AND c.ends_on >= d) >= 2 THEN
        RAISE EXCEPTION 'Both promoted rows are taken on %', to_char(d, 'DD Mon');
      END IF;
    END LOOP;
  END IF;
  INSERT INTO public.ad_campaigns (advertiser_id, session_id, placement, city, sport, headline, starts_on, ends_on, price_eur)
    VALUES (v_me, p_session, p_placement, v_city, s.sport, nullif(left(trim(coalesce(p_headline, '')), 80), ''), p_start, v_end, v_price)
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.withdraw_campaign(p_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.ad_campaigns WHERE id = p_id AND advertiser_id = auth.uid() AND status = 'in_review';
$$;

CREATE OR REPLACE FUNCTION public.set_campaign_paused(p_id uuid, p_paused boolean) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ad_campaigns SET status = CASE WHEN p_paused THEN 'paused' ELSE 'approved' END
   WHERE id = p_id AND advertiser_id = auth.uid() AND status IN ('approved', 'paused');
$$;

CREATE OR REPLACE FUNCTION public.admin_review_campaign(p_id uuid, p_approve boolean, p_note text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.ad_campaigns
     SET status = CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,
         review_note = nullif(left(coalesce(p_note, ''), 240), ''), reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = p_id AND status = 'in_review';
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_campaign_payment(p_id uuid, p_payment text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF p_payment NOT IN ('unpaid', 'invoiced', 'paid') THEN RAISE EXCEPTION 'Unknown payment state'; END IF;
  UPDATE public.ad_campaigns SET payment = p_payment WHERE id = p_id;
END $$;

-- The advertiser's campaigns with results. Views and clicks come from the activity log.
CREATE OR REPLACE FUNCTION public.my_campaigns() RETURNS TABLE (
  id uuid, session_id uuid, session_title text, placement text, city text, starts_on date, ends_on date, price_eur numeric,
  status text, effective_status text, payment text, review_note text, views bigint, clicks bigint, requests bigint, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.session_id, s.title, c.placement, c.city, c.starts_on, c.ends_on, c.price_eur, c.status,
    CASE WHEN c.status = 'approved' AND current_date > c.ends_on THEN 'ended'
         WHEN c.status = 'approved' AND current_date < c.starts_on THEN 'scheduled'
         WHEN c.status = 'approved' THEN 'live' ELSE c.status END,
    c.payment, c.review_note,
    (SELECT count(*) FROM public.engagement_events e WHERE e.campaign_id = c.id AND e.event_type = 'impression'),
    (SELECT count(*) FROM public.engagement_events e WHERE e.campaign_id = c.id AND e.event_type = 'click'),
    (SELECT count(*) FROM public.spot_requests r WHERE r.session_id = c.session_id AND r.created_at::date BETWEEN c.starts_on AND c.ends_on),
    c.created_at
  FROM public.ad_campaigns c JOIN public.coach_sessions s ON s.id = c.session_id
  WHERE c.advertiser_id = auth.uid() ORDER BY c.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_campaigns() RETURNS TABLE (
  id uuid, advertiser_name text, session_title text, placement text, city text, starts_on date, ends_on date, price_eur numeric,
  status text, payment text, review_note text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, coalesce(cl.name, p.full_name), s.title, c.placement, c.city, c.starts_on, c.ends_on, c.price_eur, c.status, c.payment, c.review_note, c.created_at
  FROM public.ad_campaigns c
  JOIN public.coach_sessions s ON s.id = c.session_id
  JOIN public.profiles p ON p.id = c.advertiser_id
  LEFT JOIN public.club_profiles cl ON cl.id = c.advertiser_id
  WHERE public.is_admin(auth.uid()) ORDER BY (c.status = 'in_review') DESC, c.created_at DESC;
$$;

-- 5. Scores -----------------------------------------------------------------
-- Heat is 100 points: demand 35, filling up 20, saved 15, starting soon 15, quality 15.
-- Activity in the last 24 hours counts in full, the next 48 hours at half.
CREATE OR REPLACE FUNCTION public.trending_scores(p_as_of timestamptz, p_city text) RETURNS TABLE (
  session_id uuid, heat int, demand numeric, filling numeric, saved numeric, soon numeric, quality numeric,
  book24 int, req24 int, save24 int, hot boolean, rank int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT s.id, s.coach_id, s.starts_at, s.capacity,
      (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = s.id AND a.status IN ('booked', 'attended') AND a.created_at <= p_as_of) AS booked,
      coalesce((SELECT cp.verified FROM public.coach_profiles cp WHERE cp.id = s.coach_id), (SELECT cl.verified FROM public.club_profiles cl WHERE cl.id = s.coach_id), false) AS verified
    FROM public.coach_sessions s
    WHERE s.is_public AND s.status = 'scheduled' AND s.kind <> 'hire' AND s.capacity IS NOT NULL
      AND s.created_at <= p_as_of AND s.starts_at > p_as_of
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.coach_id AND p.city ILIKE '%' || p_city || '%')
      AND (EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = s.coach_id AND cp.application_status = 'approved')
        OR EXISTS (SELECT 1 FROM public.club_profiles cl WHERE cl.id = s.coach_id AND cl.application_status = 'approved'))
  ), sig AS (
    SELECT b.*,
      (SELECT coalesce(sum(CASE WHEN a.created_at > p_as_of - interval '24 hours' THEN 1 ELSE 0.5 END), 0) FROM public.session_attendees a
        WHERE a.session_id = b.id AND a.status IN ('booked', 'attended') AND a.created_at <= p_as_of AND a.created_at > p_as_of - interval '72 hours') AS book_w,
      (SELECT coalesce(sum(CASE WHEN r.created_at > p_as_of - interval '24 hours' THEN 1 ELSE 0.5 END), 0) FROM public.spot_requests r
        WHERE r.session_id = b.id AND r.created_at <= p_as_of AND r.created_at > p_as_of - interval '72 hours') AS req_w,
      (SELECT coalesce(sum(CASE WHEN k.created_at > p_as_of - interval '24 hours' THEN 1 ELSE 0.5 END), 0) FROM public.bookmarks k
        WHERE k.target_type = 'session' AND k.target_id::text = b.id::text AND k.created_at <= p_as_of AND k.created_at > p_as_of - interval '72 hours') AS save_w,
      (SELECT count(*) FROM public.session_waitlist w WHERE w.session_id = b.id AND w.created_at <= p_as_of AND w.created_at > p_as_of - interval '72 hours') AS wait_n,
      (SELECT count(*)::int FROM public.session_attendees a WHERE a.session_id = b.id AND a.status IN ('booked', 'attended') AND a.created_at <= p_as_of AND a.created_at > p_as_of - interval '24 hours') AS book24,
      (SELECT count(*)::int FROM public.spot_requests r WHERE r.session_id = b.id AND r.created_at <= p_as_of AND r.created_at > p_as_of - interval '24 hours') AS req24,
      (SELECT count(*)::int FROM public.bookmarks k WHERE k.target_type = 'session' AND k.target_id::text = b.id::text AND k.created_at <= p_as_of AND k.created_at > p_as_of - interval '24 hours') AS save24,
      extract(epoch FROM b.starts_at - p_as_of) / 3600.0 AS hrs
    FROM base b
  ), scored AS (
    SELECT g.*,
      least(1, (g.book_w + g.req_w + g.wait_n * 0.5) / 12.0) AS v,
      least(1, CASE WHEN g.booked >= g.capacity THEN 0.9
                    WHEN g.booked::numeric / g.capacity < 0.5 THEN (g.booked::numeric / g.capacity) * 1.2
                    ELSE 0.6 + ((g.booked::numeric / g.capacity) - 0.5) * 0.8 END) AS f,
      least(1, g.save_w / 30.0) AS sv,
      CASE WHEN g.hrs <= 3 THEN 1 WHEN g.hrs <= 24 THEN 0.85 WHEN g.hrs <= 72 THEN 0.55 ELSE 0.3 END AS u,
      CASE WHEN g.verified THEN 1.0 ELSE 0.6 END AS q
    FROM sig g
  ), final AS (
    SELECT c.*, round(100 * (0.35 * c.v + 0.20 * c.f + 0.15 * c.sv + 0.15 * c.u + 0.15 * c.q))::int AS heat_i,
      (c.book_w + c.req_w >= 2 OR c.save_w >= 8) AS is_hot
    FROM scored c
  )
  SELECT f.id, f.heat_i, round(f.v, 2), round(f.f, 2), round(f.sv, 2), round(f.u, 2), round(f.q, 2), f.book24, f.req24, f.save24, f.is_hot,
    CASE WHEN f.is_hot THEN (row_number() OVER (PARTITION BY f.is_hot ORDER BY f.heat_i DESC, f.starts_at ASC))::int END
  FROM final f;
$$;
REVOKE ALL ON FUNCTION public.trending_scores(timestamptz, text) FROM PUBLIC, anon, authenticated;

-- 6. The one call the Trending page makes -----------------------------------
CREATE OR REPLACE FUNCTION public.get_trending(p_city text DEFAULT 'Sofia', p_sport text DEFAULT NULL, p_kind text DEFAULT 'all', p_period text DEFAULT 'week') RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tz text := CASE WHEN p_city = 'Sofia' THEN 'Europe/Sofia' ELSE 'Europe/Paris' END;
  v_sport text := nullif(lower(coalesce(p_sport, '')), '');
  v_end timestamptz := now() + interval '7 days';
  v_rows jsonb; v_coming jsonb; v_soon jsonb; v_promo jsonb; v_pick jsonb; v_picks jsonb; v_sports jsonb; v_tiles jsonb; v_hot int;
BEGIN
  IF p_period = 'tonight' THEN v_end := (date_trunc('day', now() AT TIME ZONE v_tz) + interval '28 hours') AT TIME ZONE v_tz;
  ELSIF p_period = 'weekend' THEN v_end := now() + interval '8 days'; END IF;

  RETURN (
  WITH cur AS (SELECT * FROM public.trending_scores(now(), p_city)),
  prev AS (SELECT session_id, rank FROM public.trending_scores(now() - interval '24 hours', p_city)),
  s AS (
    SELECT c.*, p.rank AS prev_rank, ps.title, ps.sport, ps.starts_at, ps.ends_at, ps.location, ps.capacity, ps.spots_left, ps.price, ps.is_popup, ps.led_by, ps.owner_id,
      coalesce(cl.name, pr.full_name) AS host_name, CASE WHEN cl.id IS NOT NULL THEN 'club' ELSE 'coach' END AS host_kind,
      coalesce(cp.verified, cl.verified, false) AS verified,
      EXISTS (SELECT 1 FROM public.trending_items ti WHERE ti.session_id = c.session_id AND ti.active AND (ti.ends_on IS NULL OR ti.ends_on >= current_date)) AS pinned
    FROM cur c
    JOIN public.public_sessions ps ON ps.id = c.session_id
    JOIN public.profiles pr ON pr.id = ps.owner_id
    LEFT JOIN public.coach_profiles cp ON cp.id = ps.owner_id
    LEFT JOIN public.club_profiles cl ON cl.id = ps.owner_id
    LEFT JOIN prev p ON p.session_id = c.session_id
    WHERE (v_sport IS NULL OR v_sport = 'all' OR lower(ps.sport) = v_sport)
  ),
  scoped AS (
    SELECT * FROM s WHERE starts_at <= v_end
      AND (p_period <> 'weekend' OR (extract(dow FROM starts_at AT TIME ZONE v_tz) IN (0, 6)
           OR (extract(dow FROM starts_at AT TIME ZONE v_tz) = 5 AND extract(hour FROM starts_at AT TIME ZONE v_tz) >= 17)))
  ),
  chart AS (SELECT *, (row_number() OVER (ORDER BY rank))::int AS drank FROM scoped WHERE hot ORDER BY rank LIMIT 8),
  rest AS (SELECT * FROM scoped WHERE NOT hot ORDER BY starts_at LIMIT 6),
  soonrows AS (SELECT * FROM s WHERE spots_left > 0 AND (is_popup OR starts_at <= now() + interval '8 hours') ORDER BY starts_at LIMIT 3),
  promo AS (
    SELECT cm.id AS campaign_id, cm.headline, cm.session_id, ps.title, ps.sport, ps.starts_at, ps.location, ps.capacity, ps.spots_left, ps.owner_id,
      coalesce(cl.name, pr.full_name) AS host_name
    FROM public.ad_campaigns cm
    JOIN public.public_sessions ps ON ps.id = cm.session_id
    JOIN public.profiles pr ON pr.id = cm.advertiser_id
    LEFT JOIN public.club_profiles cl ON cl.id = cm.advertiser_id
    WHERE cm.status = 'approved' AND cm.city = p_city AND cm.placement = 'row' AND current_date BETWEEN cm.starts_on AND cm.ends_on AND ps.spots_left > 0
      AND (v_sport IS NULL OR v_sport = 'all' OR lower(ps.sport) = v_sport)
    ORDER BY cm.starts_on, cm.created_at LIMIT 2
  ),
  pk AS (
    SELECT cm.id AS campaign_id, cm.headline, cm.session_id, ps.title, ps.sport, ps.starts_at, ps.location, ps.capacity, ps.spots_left, ps.owner_id,
      coalesce(cl.name, pr.full_name) AS host_name
    FROM public.ad_campaigns cm
    JOIN public.public_sessions ps ON ps.id = cm.session_id
    JOIN public.profiles pr ON pr.id = cm.advertiser_id
    LEFT JOIN public.club_profiles cl ON cl.id = cm.advertiser_id
    WHERE cm.status = 'approved' AND cm.city = p_city AND cm.placement = 'pick' AND current_date BETWEEN cm.starts_on AND cm.ends_on AND ps.spots_left > 0
    ORDER BY cm.created_at LIMIT 1
  ),
  picks AS (
    SELECT ti.id, ti.type, ti.title, ti.blurb, ti.sport, ti.image_url, ti.starts_on, ti.ends_on, ti.owner_id, ti.session_id, ti.rank
    FROM public.trending_items ti WHERE ti.active AND (ti.ends_on IS NULL OR ti.ends_on >= current_date) AND (ti.city IS NULL OR ti.city = p_city)
      AND (v_sport IS NULL OR v_sport = 'all' OR ti.sport IS NULL OR lower(ti.sport) = v_sport)
  ),
  j AS (SELECT
    (SELECT count(*) FROM s WHERE hot) AS hot_n,
    coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', session_id, 'kind', 'session', 'title', title, 'sport', sport, 'host', host_name, 'host_kind', host_kind, 'host_id', owner_id, 'location', location,
      'starts_at', starts_at, 'capacity', capacity, 'spots_left', spots_left, 'price', price, 'popup', is_popup, 'verified', verified, 'pinned', pinned,
      'heat', heat, 'rank', drank, 'city_rank', rank, 'prev_rank', prev_rank, 'book24', book24, 'req24', req24, 'save24', save24,
      'parts', jsonb_build_object('demand', round(demand * 100), 'filling', round(filling * 100), 'saved', round(saved * 100), 'soon', round(soon * 100), 'quality', round(quality * 100))
    ) ORDER BY drank) FROM chart), '[]'::jsonb) AS rows,
    coalesce((SELECT jsonb_agg(jsonb_build_object('id', session_id, 'title', title, 'sport', sport, 'host', host_name, 'host_id', owner_id, 'location', location,
      'starts_at', starts_at, 'capacity', capacity, 'spots_left', spots_left, 'popup', is_popup) ORDER BY starts_at) FROM rest), '[]'::jsonb) AS coming,
    coalesce((SELECT jsonb_agg(jsonb_build_object('id', session_id, 'title', title, 'sport', sport, 'host', host_name, 'host_id', owner_id, 'location', location,
      'starts_at', starts_at, 'capacity', capacity, 'spots_left', spots_left, 'popup', is_popup) ORDER BY starts_at) FROM soonrows), '[]'::jsonb) AS soon,
    coalesce((SELECT jsonb_agg(jsonb_build_object('campaign_id', campaign_id, 'id', session_id, 'title', coalesce(headline, title), 'sport', sport, 'host', host_name, 'host_id', owner_id,
      'location', location, 'starts_at', starts_at, 'capacity', capacity, 'spots_left', spots_left) ORDER BY starts_at) FROM promo), '[]'::jsonb) AS promoted,
    (SELECT to_jsonb(pk) FROM pk) AS pick,
    coalesce((SELECT jsonb_agg(to_jsonb(picks) ORDER BY rank) FROM picks WHERE type = 'event'), '[]'::jsonb) AS events,
    coalesce((SELECT jsonb_agg(to_jsonb(picks) ORDER BY rank) FROM picks WHERE type = 'sport'), '[]'::jsonb) AS sport_tiles,
    coalesce((SELECT jsonb_agg(DISTINCT lower(sport)) FROM (SELECT ps.sport FROM public.public_sessions ps UNION ALL SELECT sport FROM picks) z WHERE sport IS NOT NULL), '[]'::jsonb) AS sports
  )
  SELECT jsonb_build_object('mode', CASE WHEN j.hot_n >= 5 THEN 'hot' ELSE 'cold' END, 'city', p_city, 'generated_at', now(),
    'rows', j.rows, 'coming', j.coming, 'soon', j.soon, 'promoted', j.promoted, 'pick', j.pick, 'events', j.events, 'sport_tiles', j.sport_tiles, 'sports', j.sports)
  FROM j);
END $$;
REVOKE ALL ON FUNCTION public.get_trending(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trending(text, text, text, text) TO anon, authenticated;

-- Functions the app may call when signed in.
REVOKE ALL ON FUNCTION public.join_waitlist(uuid), public.leave_waitlist(uuid), public.claim_waitlist(uuid),
  public.create_campaign(uuid, text, date, int, text), public.withdraw_campaign(uuid), public.set_campaign_paused(uuid, boolean),
  public.admin_review_campaign(uuid, boolean, text), public.admin_set_campaign_payment(uuid, text), public.my_campaigns(), public.admin_campaigns() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_waitlist(uuid), public.leave_waitlist(uuid), public.claim_waitlist(uuid),
  public.create_campaign(uuid, text, date, int, text), public.withdraw_campaign(uuid), public.set_campaign_paused(uuid, boolean),
  public.admin_review_campaign(uuid, boolean, text), public.admin_set_campaign_payment(uuid, text), public.my_campaigns(), public.admin_campaigns() TO authenticated;
