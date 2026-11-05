-- LockerNoise project ONLY. Run after migration 10 and before deploying the UI.
-- Additive; preserves existing posts, captions, videos, likes and comments.
BEGIN;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS facebook_video_url text;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.posts'::regclass AND conname='posts_facebook_video_url_format') THEN
   ALTER TABLE public.posts ADD CONSTRAINT posts_facebook_video_url_format
   CHECK (facebook_video_url IS NULL OR facebook_video_url ~ '^https://(www\.facebook\.com/(watch\?v=[0-9]+|reel/[0-9]+|share/[vr]/[A-Za-z0-9_-]+)|fb\.watch/[A-Za-z0-9_-]+)$');
 END IF;
END $$;
-- Migration 06 restricts updates to original authors and body only.
-- Allow editing the separated Facebook video url in addition to the caption.
GRANT UPDATE(facebook_video_url) ON public.posts TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
