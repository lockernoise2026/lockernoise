-- RUN ONLY IN THE LockerNoise Supabase project, after migrations 01-07.
-- Safe additive migration: tags existing posts without modifying/deleting them.
BEGIN;
CREATE TABLE IF NOT EXISTS public.post_mentions (
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 mentioned_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(post_id, mentioned_user_id)
);
CREATE INDEX IF NOT EXISTS post_mentions_user_idx ON public.post_mentions(mentioned_user_id,created_at DESC);
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can read post tags" ON public.post_mentions;
CREATE POLICY "Members can read post tags" ON public.post_mentions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Post authors tag friends" ON public.post_mentions;
CREATE POLICY "Post authors tag friends" ON public.post_mentions FOR INSERT TO authenticated
 WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id=post_id AND p.author_id=(SELECT auth.uid())));
DROP POLICY IF EXISTS "Post authors remove tags" ON public.post_mentions;
CREATE POLICY "Post authors remove tags" ON public.post_mentions FOR DELETE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id=post_id AND p.author_id=(SELECT auth.uid())));
REVOKE ALL ON public.post_mentions FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.post_mentions TO authenticated;

-- A member may tag ONLY someone with an accepted friendship. Enforced on server.
CREATE OR REPLACE FUNCTION public.lockernoise_validate_post_mention() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE writer uuid;
BEGIN
 SELECT author_id INTO writer FROM public.posts WHERE id=NEW.post_id;
 IF writer IS NULL OR writer<>auth.uid() THEN RAISE EXCEPTION 'Only the post author may tag friends'; END IF;
 IF writer=NEW.mentioned_user_id THEN RAISE EXCEPTION 'You cannot tag yourself as a friend'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM public.friendships f WHERE f.status='accepted' AND
  ((f.requester_id=writer AND f.addressee_id=NEW.mentioned_user_id) OR
   (f.addressee_id=writer AND f.requester_id=NEW.mentioned_user_id))
 ) THEN RAISE EXCEPTION 'Only accepted friends can be tagged'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_check_post_mention ON public.post_mentions;
CREATE TRIGGER lockernoise_check_post_mention BEFORE INSERT ON public.post_mentions
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_validate_post_mention();

-- Extend the existing notifications table's kind constraint without weakening RLS.
ALTER TABLE public.activity_notifications DROP CONSTRAINT IF EXISTS activity_notifications_kind_check;
ALTER TABLE public.activity_notifications ADD CONSTRAINT activity_notifications_kind_check
 CHECK (kind IN ('comment','reply','mention'));
CREATE UNIQUE INDEX IF NOT EXISTS activity_notifications_unique_mention_idx
 ON public.activity_notifications(recipient_id,post_id,kind) WHERE kind='mention';

CREATE OR REPLACE FUNCTION public.lockernoise_notify_post_mention() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE writer uuid; body_preview text;
BEGIN
 SELECT author_id,body INTO writer,body_preview FROM public.posts WHERE id=NEW.post_id;
 IF writer IS NOT NULL AND writer<>NEW.mentioned_user_id THEN
  INSERT INTO public.activity_notifications(recipient_id,actor_id,post_id,kind,preview)
  VALUES(NEW.mentioned_user_id,writer,NEW.post_id,'mention',left(body_preview,120))
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS lockernoise_post_mention_alert ON public.post_mentions;
CREATE TRIGGER lockernoise_post_mention_alert AFTER INSERT ON public.post_mentions
 FOR EACH ROW EXECUTE FUNCTION public.lockernoise_notify_post_mention();
COMMIT;
NOTIFY pgrst,'reload schema';
