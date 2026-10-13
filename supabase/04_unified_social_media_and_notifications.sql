-- LockerNoise October 2026 coordinated update, new LockerNoise Supabase project ONLY.
-- BACK UP FIRST. Run ONCE before uploading the bundled website update.
-- Idempotent where possible; never drops existing rows, tables, messages or media.
BEGIN;

-- Editable bio used by the real My Profile screen.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_bio_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio)<=240);
  END IF;
END $$;

-- Allow media-only posts. The original unnamed CHECK on posts required either
-- nonempty text or legacy image_path, and blocks modern post_media uploads.
-- Only remove CHECK constraints whose expressions match that exact old rule.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname,pg_get_constraintdef(oid) AS expr
           FROM pg_constraint WHERE conrelid='public.posts'::regclass AND contype='c'
  LOOP
    IF r.expr ILIKE '%image_path%' AND r.expr ILIKE '%body%' THEN
      EXECUTE format('ALTER TABLE public.posts DROP CONSTRAINT %I',r.conname);
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  storage_path text NOT NULL,
  position smallint NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 4),
  duration_seconds numeric CHECK (duration_seconds IS NULL OR (duration_seconds>0 AND duration_seconds<=300)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id,position), UNIQUE(storage_path)
);
CREATE INDEX IF NOT EXISTS post_media_post_idx ON public.post_media(post_id,position);
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read posted media" ON public.post_media;
CREATE POLICY "Members read posted media" ON public.post_media FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authors attach own media" ON public.post_media;
CREATE POLICY "Authors attach own media" ON public.post_media FOR INSERT TO authenticated
 WITH CHECK (owner_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id AND p.author_id=(SELECT auth.uid())));
DROP POLICY IF EXISTS "Authors remove own media" ON public.post_media;
CREATE POLICY "Authors remove own media" ON public.post_media FOR DELETE TO authenticated USING (owner_id=(SELECT auth.uid()));
REVOKE ALL ON public.post_media FROM anon;
GRANT SELECT,INSERT,DELETE ON public.post_media TO authenticated;

-- Existing post-images bucket stays in place. Extra images share its policy.
-- New videos live in a separate bucket with 50 MB upload maximum.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('post-videos','post-videos',true,52428800,ARRAY['video/mp4','video/webm'])
 ON CONFLICT (id) DO UPDATE SET file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "LockerNoise members upload own video" ON storage.objects;
CREATE POLICY "LockerNoise members upload own video" ON storage.objects
 FOR INSERT TO authenticated WITH CHECK
 (bucket_id='post-videos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
DROP POLICY IF EXISTS "LockerNoise members delete own video" ON storage.objects;
CREATE POLICY "LockerNoise members delete own video" ON storage.objects
 FOR DELETE TO authenticated USING
 (bucket_id='post-videos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

-- Blitz read-state belongs to the recipient and follows their account across devices.
ALTER TABLE public.blitzes ADD COLUMN IF NOT EXISTS read_at timestamptz;
DROP POLICY IF EXISTS "Blitz recipients mark as seen" ON public.blitzes;
CREATE POLICY "Blitz recipients mark as seen" ON public.blitzes
 FOR UPDATE TO authenticated USING (recipient_id=(SELECT auth.uid()))
 WITH CHECK (recipient_id=(SELECT auth.uid()));
REVOKE UPDATE ON public.blitzes FROM authenticated;
GRANT UPDATE(read_at) ON public.blitzes TO authenticated;

COMMIT;
NOTIFY pgrst,'reload schema';
