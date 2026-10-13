CREATE POLICY "Owner uploads certificate" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner reads certificate" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner deletes certificate" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read certificates" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND public.is_admin(auth.uid()));

CREATE TABLE public.coach_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  issuer text CHECK (issuer IS NULL OR char_length(issuer) <= 120),
  issued_on date,
  file_path text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_certificates_owner_idx ON public.coach_certificates(owner_id);
CREATE INDEX coach_certificates_status_idx ON public.coach_certificates(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_certificates TO authenticated;
GRANT ALL ON public.coach_certificates TO service_role;
ALTER TABLE public.coach_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own certificates" ON public.coach_certificates FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner adds certificates" ON public.coach_certificates FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes own certificates" ON public.coach_certificates FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins read certificates" ON public.coach_certificates FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins review certificates" ON public.coach_certificates FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_certificate_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.owner_id := auth.uid();
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  IF NEW.owner_id IS NULL OR left(NEW.file_path, length(NEW.owner_id::text) + 1) <> NEW.owner_id::text || '/' THEN
    RAISE EXCEPTION 'Certificate file must be stored in the owner''s folder';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER coach_certificates_guard BEFORE INSERT OR UPDATE ON public.coach_certificates
FOR EACH ROW EXECUTE FUNCTION public.tg_certificate_guard();

CREATE VIEW public.public_certificates AS
  SELECT owner_id, title, issuer, issued_on
  FROM public.coach_certificates
  WHERE status = 'approved';
GRANT SELECT ON public.public_certificates TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_verified_requires_certificate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verified AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.verified, false)) AND NOT EXISTS (
    SELECT 1 FROM public.coach_certificates c WHERE c.owner_id = NEW.id AND c.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Cannot verify this coach: no approved certificate yet';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER coach_profiles_verified_requires_certificate BEFORE INSERT OR UPDATE OF verified ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_verified_requires_certificate();