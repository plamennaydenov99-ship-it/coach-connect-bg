ALTER TABLE public.profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can view coach applications"
ON public.coach_profiles
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

CREATE POLICY "Admins can review coach applications"
ON public.coach_profiles
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));