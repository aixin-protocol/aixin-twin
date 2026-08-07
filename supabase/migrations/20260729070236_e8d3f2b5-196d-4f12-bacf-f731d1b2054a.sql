
-- 1. Extend skills
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS price_cents integer,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('private','public')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'live' CHECK (status IN ('draft','live')),
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Backfill price_cents from legacy price column
UPDATE public.skills SET price_cents = ROUND(price * 100)::integer WHERE price IS NOT NULL AND price_cents IS NULL;

-- 2. skill_installs: pinned_version
ALTER TABLE public.skill_installs
  ADD COLUMN IF NOT EXISTS pinned_version integer NOT NULL DEFAULT 1;

-- 3. New table: skill_versions
CREATE TABLE IF NOT EXISTS public.skill_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  version integer NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  intent text,
  rules text,
  adapter text NOT NULL DEFAULT 'test' CHECK (adapter IN ('test','live')),
  price_cents integer,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live')),
  changelog text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (skill_id, version)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_versions TO authenticated;
GRANT ALL ON public.skill_versions TO service_role;

ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;

-- Author can manage their own versions
CREATE POLICY "author manage versions" ON public.skill_versions
  FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Installers can read versions of skills they've installed
CREATE POLICY "installer read versions" ON public.skill_versions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.skill_installs si
    WHERE si.skill_id = skill_versions.skill_id AND si.user_id = auth.uid()
  ));

-- Seed a v1 row for every existing skill that doesn't already have one
INSERT INTO public.skill_versions (skill_id, version, name, category, intent, rules, adapter, price_cents, visibility, status, changelog, created_by, created_at)
SELECT s.id, 1, s.name, s.category,
       COALESCE((s.schema->>'intent')::text, ''),
       COALESCE((s.rules->>'text')::text, ''),
       'test',
       s.price_cents,
       'public',
       'live',
       'Initial version',
       COALESCE(s.author_id, '00000000-0000-0000-0000-000000000000'::uuid),
       s.created_at
FROM public.skills s
WHERE s.author_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.skill_versions v WHERE v.skill_id = s.id AND v.version = 1);
