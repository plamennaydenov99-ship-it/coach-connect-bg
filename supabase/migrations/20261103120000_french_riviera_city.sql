-- French Riviera instead of Nice/Monaco (2026-11-03)
-- The Riviera market is one area, "French Riviera" (Nice to Cap-d'Ail); Monaco is no longer a city of its own.
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_city_check;
UPDATE public.ad_campaigns SET city = 'French Riviera' WHERE city IN ('Nice', 'Monaco');
ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_city_check CHECK (city IN ('Sofia', 'French Riviera'));

-- Map a profile city to its campaign market: Riviera towns from Nice to Cap-d'Ail → 'French Riviera', else 'Sofia'.
CREATE OR REPLACE FUNCTION public.campaign_market(p_city text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN regexp_replace(lower(translate(coalesce(split_part(p_city, ',', 1), ''), 'ÈÉèéÔô', 'EEeeoo')), '[^a-z]', '', 'g')
    IN ('nice', 'villefranchesurmer', 'saintjeancapferrat', 'stjeancapferrat', 'beaulieusurmer', 'eze', 'laturbie', 'capdail',
        'frenchriviera', 'cotedazur')
  THEN 'French Riviera' ELSE 'Sofia' END
$$;

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
  SELECT public.campaign_market(city) INTO v_city FROM public.profiles WHERE id = v_me;
  v_city := coalesce(v_city, 'Sofia');
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
