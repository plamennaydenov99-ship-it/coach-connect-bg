-- Protect review fields (2026-10-31)
-- Coaches and clubs could approve themselves by updating their own row
-- (application_status = 'approved'), skipping admin review and appearing publicly.
-- Owners may now only submit for review (draft/rejected -> pending); approving,
-- rejecting, verifying and the reviewed_* stamps are admin-only.
-- Database/service-role changes (auth.uid() IS NULL, e.g. the signup trigger) stay unrestricted.
CREATE OR REPLACE FUNCTION public.tg_protect_review_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.application_status NOT IN ('draft', 'pending') THEN
      RAISE EXCEPTION 'New applications must start as draft or pending';
    END IF;
    IF NEW.verified OR NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL THEN
      RAISE EXCEPTION 'Review fields can only be set by an admin';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Review fields can only be changed by an admin';
  END IF;

  IF NEW.application_status IS DISTINCT FROM OLD.application_status
     AND NOT (NEW.application_status = 'pending' AND OLD.application_status IN ('draft', 'rejected')) THEN
    RAISE EXCEPTION 'Only an admin can change application status to %', NEW.application_status;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS coach_profiles_protect_review_fields ON public.coach_profiles;
CREATE TRIGGER coach_profiles_protect_review_fields
BEFORE INSERT OR UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_review_fields();

DROP TRIGGER IF EXISTS club_profiles_protect_review_fields ON public.club_profiles;
CREATE TRIGGER club_profiles_protect_review_fields
BEFORE INSERT OR UPDATE ON public.club_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_review_fields();
