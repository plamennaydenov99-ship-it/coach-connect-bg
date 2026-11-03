-- Server-side rate limit for the public "report this listing" form (launch audit item 18).
-- Anyone can file a report without signing in, so the database caps how fast reports can arrive:
--   * at most 3 reports about the same listing in 10 minutes
--   * at most 60 reports in total per hour
-- The form also has a honeypot field. Over the limit, the insert fails with "too many reports".

CREATE OR REPLACE FUNCTION public.tg_listing_reports_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF (SELECT count(*) FROM public.listing_reports
        WHERE target_id = NEW.target_id AND created_at > now() - interval '10 minutes') >= 3
     OR (SELECT count(*) FROM public.listing_reports
        WHERE created_at > now() - interval '1 hour') >= 60 THEN
    RAISE EXCEPTION 'too many reports, please try again later' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.tg_listing_reports_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS listing_reports_rate_limit ON public.listing_reports;
CREATE TRIGGER listing_reports_rate_limit
  BEFORE INSERT ON public.listing_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_listing_reports_rate_limit();

CREATE INDEX IF NOT EXISTS listing_reports_target_created_idx ON public.listing_reports (target_id, created_at DESC);
