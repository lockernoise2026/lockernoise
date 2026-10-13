-- LockerNoise ONLY: signed-in members can privately bookmark posts.
-- Execute this AFTER 04_unified_social_media_and_notifications.sql.
-- Does not remove existing posts or modify unrelated data.
BEGIN;
CREATE TABLE IF NOT EXISTS public.saved_posts (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,post_id)
);
CREATE INDEX IF NOT EXISTS saved_posts_user_recent_idx ON public.saved_posts(user_id,created_at DESC);
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see only their saved posts" ON public.saved_posts;
CREATE POLICY "Members see only their saved posts" ON public.saved_posts
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Members save posts for themselves" ON public.saved_posts;
CREATE POLICY "Members save posts for themselves" ON public.saved_posts
 FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Members unsave their posts" ON public.saved_posts;
CREATE POLICY "Members unsave their posts" ON public.saved_posts
 FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));
REVOKE ALL ON public.saved_posts FROM PUBLIC,anon;
GRANT SELECT,INSERT,DELETE ON public.saved_posts TO authenticated;
COMMIT;
NOTIFY pgrst,'reload schema';
