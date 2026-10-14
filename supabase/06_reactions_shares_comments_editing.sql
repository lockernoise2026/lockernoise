-- LockerNoise ONLY. Run in lockernoise2026's LockerNoise project, AFTER 04 and 05.
-- Adds reactions, text-only post editing, reshares, comment/reply notifications and safe retries.
-- No existing posts, comments, reactions, friends, or media are deleted.
BEGIN;

CREATE TABLE IF NOT EXISTS public.post_reactions (
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 reaction text NOT NULL CHECK (reaction IN ('like','love','care','haha','wow','sad','angry','fire','dislike')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (post_id,user_id)
);
CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions(post_id);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view post reactions" ON public.post_reactions;
CREATE POLICY "Members view post reactions" ON public.post_reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Members add their own reactions" ON public.post_reactions;
CREATE POLICY "Members add their own reactions" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Members change their reactions" ON public.post_reactions;
CREATE POLICY "Members change their reactions" ON public.post_reactions FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Members remove their reactions" ON public.post_reactions;
CREATE POLICY "Members remove their reactions" ON public.post_reactions FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));
REVOKE ALL ON public.post_reactions FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE(reaction),DELETE ON public.post_reactions TO authenticated;
-- Preserve existing thumbs-up and thumbs-down votes as their corresponding reactions.
INSERT INTO public.post_reactions(post_id,user_id,reaction)
 SELECT post_id,user_id,CASE WHEN value=1 THEN 'like' ELSE 'dislike' END
 FROM public.votes WHERE value IN (1,-1)
 ON CONFLICT (post_id,user_id) DO NOTHING;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS client_post_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS posts_author_client_submission_idx ON public.posts(author_id,client_post_id) WHERE client_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_shared_source_idx ON public.posts(shared_post_id) WHERE shared_post_id IS NOT NULL;
DROP POLICY IF EXISTS "Authors edit their own post text" ON public.posts;
CREATE POLICY "Authors edit their own post text" ON public.posts FOR UPDATE TO authenticated
 USING (author_id=(SELECT auth.uid())) WITH CHECK (author_id=(SELECT auth.uid()));
-- Do not grant member-level editing of author, team, media, or original share reference.
REVOKE UPDATE,DELETE ON public.posts FROM authenticated;
REVOKE UPDATE,DELETE ON public.posts FROM PUBLIC;
GRANT UPDATE(body) ON public.posts TO authenticated;
-- Prevent resharing posts authored by private-profile members without their consent.
CREATE OR REPLACE FUNCTION public.lockernoise_validate_reshare() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE original_owner uuid; original_visibility text;
BEGIN
 IF NEW.shared_post_id IS NOT NULL THEN
  IF NEW.shared_post_id=NEW.id THEN RAISE EXCEPTION 'Cannot share a post into itself'; END IF;
  SELECT p.author_id,pr.profile_visibility INTO original_owner,original_visibility
    FROM public.posts p JOIN public.profiles pr ON pr.id=p.author_id WHERE p.id=NEW.shared_post_id;
  IF original_owner IS NULL THEN RAISE EXCEPTION 'Original post unavailable'; END IF;
  IF original_visibility='private' AND original_owner<>NEW.author_id THEN
   RAISE EXCEPTION 'Posts from private profiles cannot be reshared';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_reshares_valid ON public.posts;
CREATE TRIGGER lockernoise_reshares_valid BEFORE INSERT ON public.posts
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_validate_reshare();

CREATE OR REPLACE FUNCTION public.lockernoise_set_post_edited_at() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.body IS DISTINCT FROM OLD.body THEN NEW.edited_at=now(); END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_posts_edit_time ON public.posts;
CREATE TRIGGER lockernoise_posts_edit_time BEFORE UPDATE ON public.posts
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_set_post_edited_at();

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS comments_parent_idx ON public.comments(parent_comment_id);
CREATE OR REPLACE FUNCTION public.lockernoise_verify_reply_parent() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.parent_comment_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.comments p WHERE p.id=NEW.parent_comment_id AND p.post_id=NEW.post_id
 ) THEN RAISE EXCEPTION 'Reply must reference a comment on the same post'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_verify_reply ON public.comments;
CREATE TRIGGER lockernoise_verify_reply BEFORE INSERT ON public.comments
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_verify_reply_parent();

CREATE TABLE IF NOT EXISTS public.activity_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
 comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('comment','reply')),
 preview text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 UNIQUE(recipient_id,comment_id,kind)
);
CREATE INDEX IF NOT EXISTS activity_notifications_recipient_idx ON public.activity_notifications(recipient_id,created_at DESC);
ALTER TABLE public.activity_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only recipients see activity alerts" ON public.activity_notifications;
CREATE POLICY "Only recipients see activity alerts" ON public.activity_notifications FOR SELECT TO authenticated USING (recipient_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Only recipients acknowledge activity alerts" ON public.activity_notifications;
CREATE POLICY "Only recipients acknowledge activity alerts" ON public.activity_notifications FOR UPDATE TO authenticated USING (recipient_id=(SELECT auth.uid())) WITH CHECK (recipient_id=(SELECT auth.uid()));
REVOKE ALL ON public.activity_notifications FROM PUBLIC,anon;
GRANT SELECT,UPDATE(read_at) ON public.activity_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.lockernoise_notify_new_comment() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE destination uuid; alert_kind text; reply_recipient uuid;
BEGIN
 IF NEW.parent_comment_id IS NOT NULL THEN
  SELECT author_id INTO destination FROM public.comments WHERE id=NEW.parent_comment_id;
  alert_kind:='reply';reply_recipient:=destination;
 ELSE
  SELECT author_id INTO destination FROM public.posts WHERE id=NEW.post_id;
  alert_kind:='comment';
 END IF;
 IF destination IS NOT NULL AND destination<>NEW.author_id THEN
  INSERT INTO public.activity_notifications(recipient_id,actor_id,post_id,comment_id,kind,preview)
  VALUES(destination,NEW.author_id,NEW.post_id,NEW.id,alert_kind,left(NEW.body,120))
  ON CONFLICT (recipient_id,comment_id,kind) DO NOTHING;
 END IF;
 -- The post author should also be notified about replies from others.
 IF NEW.parent_comment_id IS NOT NULL THEN
  SELECT author_id INTO destination FROM public.posts WHERE id=NEW.post_id;
  IF destination IS NOT NULL AND destination<>NEW.author_id AND destination IS DISTINCT FROM reply_recipient THEN
   INSERT INTO public.activity_notifications(recipient_id,actor_id,post_id,comment_id,kind,preview)
   VALUES(destination,NEW.author_id,NEW.post_id,NEW.id,'comment',left(NEW.body,120))
   ON CONFLICT (recipient_id,comment_id,kind) DO NOTHING;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_comment_alert ON public.comments;
CREATE TRIGGER lockernoise_comment_alert AFTER INSERT ON public.comments
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_notify_new_comment();
COMMIT;
NOTIFY pgrst,'reload schema';
