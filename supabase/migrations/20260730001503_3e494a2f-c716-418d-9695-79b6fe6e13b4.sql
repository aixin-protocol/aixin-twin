ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS readme text;
ALTER TABLE public.skill_versions ADD COLUMN IF NOT EXISTS readme text;

DROP POLICY IF EXISTS "public skill versions readable" ON public.skill_versions;
CREATE POLICY "public skill versions readable"
ON public.skill_versions
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.skills s
  WHERE s.id = skill_versions.skill_id
    AND s.is_public = true
    AND s.status = 'live'
    AND s.visibility = 'public'
));