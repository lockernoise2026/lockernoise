-- LockerNoise initial schema. Run in a NEW, dedicated Supabase project.
-- This is not intended for any existing travel, hotel, or market databases.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check (handle ~ '^[a-z0-9_]{3,32}$'),
 display_name text not null check (char_length(display_name) between 1 and 40),
 favorite_nfl text,
 favorite_cfb text,
 avatar_url text,
 created_at timestamptz not null default now()
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 team_id text not null check (char_length(team_id) between 2 and 8),
 body text not null default '' check (char_length(body)<=2000),
 image_path text,
 created_at timestamptz not null default now(),
 check (char_length(trim(body)) > 0 or image_path is not null)
);
create index if not exists posts_team_created_idx on public.posts(team_id,created_at desc);
create table if not exists public.votes (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 value smallint not null check (value in (-1,1)),
 primary key (post_id,user_id)
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments(post_id,created_at);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 reason text not null check (reason in ('spam','harassment','hate','privacy','copyright','other')),
 created_at timestamptz not null default now(),
 unique(reporter_id,post_id)
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

create policy "Public profile basics" on public.profiles for select to anon,authenticated using (true);
create policy "Create own profile" on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy "Edit own profile" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "Public posts" on public.posts for select to anon,authenticated using (true);
create policy "Create own posts" on public.posts for insert to authenticated with check ((select auth.uid())=author_id);
create policy "Delete own posts" on public.posts for delete to authenticated using ((select auth.uid())=author_id);
create policy "Public votes" on public.votes for select to anon,authenticated using (true);
create policy "Cast own votes" on public.votes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Change own votes" on public.votes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Remove own votes" on public.votes for delete to authenticated using ((select auth.uid())=user_id);
create policy "Public comments" on public.comments for select to anon,authenticated using (true);
create policy "Create own comments" on public.comments for insert to authenticated with check ((select auth.uid())=author_id);
create policy "Delete own comments" on public.comments for delete to authenticated using ((select auth.uid())=author_id);
create policy "Report inappropriate posts" on public.reports for insert to authenticated with check ((select auth.uid())=reporter_id);
create policy "See own reports" on public.reports for select to authenticated using ((select auth.uid())=reporter_id);

-- The app connects with a browser publishable key and row-level security.
grant usage on schema public to anon,authenticated;
grant select on public.profiles,public.posts,public.votes,public.comments to anon;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,delete on public.posts to authenticated;
grant select,insert,update,delete on public.votes to authenticated;
grant select,insert,delete on public.comments to authenticated;
grant select,insert on public.reports to authenticated;

-- Uploaded images are public fan posts; enforce each user writing only to their folder.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('post-images','post-images',true,3145728,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Authenticated fans upload own pictures" on storage.objects for insert to authenticated
with check (bucket_id='post-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Fans delete own pictures" on storage.objects for delete to authenticated
using (bucket_id='post-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- For a public release add: admin moderation workflow, content removal rules,
-- email verification, abuse/rate-limiting, image scanning, reports dashboard,
-- blocking and user safety tooling, data retention and privacy policy.

-- Mutually accepted friend relationships. Friend requests are private to participants.
create table if not exists public.friendships (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 addressee_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 check(requester_id<>addressee_id),
 unique(requester_id,addressee_id)
);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);
alter table public.friendships enable row level security;
create policy "Participants can see friendships" on public.friendships for select to authenticated
using ((select auth.uid()) in (requester_id,addressee_id));
create policy "Fans can send friend requests" on public.friendships for insert to authenticated
with check ((select auth.uid())=requester_id and status='pending');
create policy "Recipient can accept incoming request" on public.friendships for update to authenticated
using ((select auth.uid())=addressee_id and status='pending')
with check ((select auth.uid())=addressee_id and status='accepted');
create policy "Either party can remove friendship" on public.friendships for delete to authenticated
using ((select auth.uid()) in (requester_id,addressee_id));
create unique index if not exists friendships_no_crossed_requests_idx on public.friendships (
 least(requester_id,addressee_id), greatest(requester_id,addressee_id)
);
-- Prevent request receivers from changing the identities involved in the link.
revoke update on public.friendships from authenticated;
grant select,insert,delete on public.friendships to authenticated;
grant update(status) on public.friendships to authenticated;
-- Before a public launch, add server-side anti-spam/rate limits and enforce
-- one relationship per unordered user pair to prevent crossed friend requests.
