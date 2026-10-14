-- LockerNoise project only. RUN AFTER 08_friend_post_tags.sql. No existing posts are changed.
-- Posts.team_id permits 2-8 characters, so NFL_ALL/CFB_ALL already fit the schema.
-- These are virtual discussion communities, not teams in a new table.
BEGIN;
ALTER TABLE public.profiles
 ADD COLUMN IF NOT EXISTS feed_sort text NOT NULL DEFAULT 'hot';
ALTER TABLE public.profiles
 DROP CONSTRAINT IF EXISTS lockernoise_profiles_feed_sort_check;
ALTER TABLE public.profiles
 ADD CONSTRAINT lockernoise_profiles_feed_sort_check
 CHECK (feed_sort IN ('hot','new','top'));
-- Row-level security: existing profile policy permits updates only by that member.
GRANT UPDATE (feed_sort) ON public.profiles TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
