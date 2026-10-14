-- LockerNoise project ONLY. Run after migration 06 and before deploying the UI.
-- Additive; preserves existing posts, captions, YouTube URLs, likes and comments.
BEGIN;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS youtube_video_id text;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.posts'::regclass AND conname='posts_youtube_video_id_format') THEN
   ALTER TABLE public.posts ADD CONSTRAINT posts_youtube_video_id_format
   CHECK (youtube_video_id IS NULL OR youtube_video_id ~ '^[A-Za-z0-9_-]{11}$');
 END IF;
END $$;
-- Migration 06 restricts updates to original authors and body only.
-- Allow editing only the separated video id in addition to the caption.
GRANT UPDATE(youtube_video_id) ON public.posts TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
