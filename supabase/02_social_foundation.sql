-- LockerNoise NEW PROJECT ONLY. Apply AFTER setup.sql in a fresh LockerNoise Supabase database.
-- Never run this against Trinity Crafters Market, Your Cruise Guy or any other live project.
-- Phase 1 schema additions: fix onboarding fields and prepare private friend DMs + Blitz.

alter table public.profiles
  add column if not exists favorite_nfl_teams text[] not null default '{}',
  add column if not exists favorite_cfb_teams text[] not null default '{}',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists profile_visibility text not null default 'public'
    check (profile_visibility in ('public','private')),
  add column if not exists allow_blitz boolean not null default true;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "Block participants can check relationship" on public.blocks for select to authenticated
  using ((select auth.uid()) in (blocker_id,blocked_id));
create policy "Block a member" on public.blocks for insert to authenticated
  with check ((select auth.uid())=blocker_id);
create policy "Unblock a member" on public.blocks for delete to authenticated
  using ((select auth.uid()) in (blocker_id,blocked_id));
grant select,insert,delete on public.blocks to authenticated;

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check(sender_id<>recipient_id)
);
create index if not exists direct_messages_sent_idx on public.direct_messages(sender_id,created_at desc);
create index if not exists direct_messages_received_idx on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
create policy "Only message participants can read" on public.direct_messages for select to authenticated
  using ((select auth.uid()) in (sender_id,recipient_id));
create policy "Only accepted friends can message" on public.direct_messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.friendships f where f.status='accepted'
      and ((f.requester_id=sender_id and f.addressee_id=recipient_id)
        or (f.requester_id=recipient_id and f.addressee_id=sender_id))
    )
    and not exists (
      select 1 from public.blocks b where
       (b.blocker_id=sender_id and b.blocked_id=recipient_id)
       or (b.blocker_id=recipient_id and b.blocked_id=sender_id)
    )
  );
grant select,insert on public.direct_messages to authenticated;

create table if not exists public.blitzes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check(sender_id<>recipient_id)
);
create index if not exists blitzes_recipient_idx on public.blitzes(recipient_id,created_at desc);
alter table public.blitzes enable row level security;
create policy "Only blitz participants can read" on public.blitzes for select to authenticated
  using ((select auth.uid()) in (sender_id,recipient_id));
create policy "Only consenting friends can be blitzed" on public.blitzes for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (select 1 from public.profiles p where p.id=recipient_id and p.allow_blitz)
    and exists (select 1 from public.friendships f where f.status='accepted'
      and ((f.requester_id=sender_id and f.addressee_id=recipient_id)
        or (f.requester_id=recipient_id and f.addressee_id=sender_id)))
    and not exists (select 1 from public.blocks b where
      (b.blocker_id=sender_id and b.blocked_id=recipient_id)
      or (b.blocker_id=recipient_id and b.blocked_id=sender_id))
  );
grant select,insert on public.blitzes to authenticated;

-- Block relationships are queryable only by the two affected accounts so messages/Blitz RLS can detect either direction.
-- Enforce the requirement that visitors must create an account to browse the community.
revoke select on public.profiles, public.posts, public.votes, public.comments from anon;

-- Production gate: this is an initial access-control layer, not complete moderation.
-- Private profile field is stored but full private-profile row/column isolation is NOT implemented.
-- Public team-community posts and public image bucket remain public by design.
-- Before public launch: build a private preferences table, hide private profile data at the SQL/API layer,
-- enforce message/Blitz rate limits server side, age/safety controls, media moderation, and a staffed reports queue.
