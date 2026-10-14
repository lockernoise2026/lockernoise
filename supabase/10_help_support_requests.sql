-- LockerNoise beta: public help tickets, with private member history.
-- RUN IN LOCKERNOISE SUPABASE ONLY. Does not modify existing messages/posts.
create extension if not exists pgcrypto;
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reply_email text not null check(length(reply_email) between 5 and 254 and reply_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  category text not null check(category in ('account','posting','friends','notifications','bug','suggestion')),
  details text not null check(length(btrim(details)) between 10 and 3000),
  account_handle text check(account_handle is null or length(account_handle)<=80),
  status text not null default 'open' check(status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists support_requests_created_idx on public.support_requests(created_at desc);
create index if not exists support_requests_user_idx on public.support_requests(user_id,created_at desc);
alter table public.support_requests enable row level security;
-- No one can read tickets except the owning signed-in member or project admin in SQL dashboard.
drop policy if exists "Owner sees own support requests" on public.support_requests;
create policy "Owner sees own support requests" on public.support_requests
 for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Guest sends support request" on public.support_requests;
create policy "Guest sends support request" on public.support_requests
 for insert to anon with check (user_id is null and account_handle is null);
drop policy if exists "Member sends own support request" on public.support_requests;
create policy "Member sends own support request" on public.support_requests
 for insert to authenticated with check (user_id = (select auth.uid()));
-- Basic per-address abuse throttle (beta only; add CAPTCHA before wide public launch).
create or replace function public.ln_support_rate_limit() returns trigger
 language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if (select count(*) from public.support_requests
     where lower(reply_email)=lower(new.reply_email) and created_at > now()-interval '15 minutes') >= 3 then
   raise exception 'Too many support requests for this email. Please try again later.';
 end if;
 return new;
end;
$$;
revoke all on function public.ln_support_rate_limit() from public,anon,authenticated;
drop trigger if exists ln_support_rate_limit_trigger on public.support_requests;
create trigger ln_support_rate_limit_trigger before insert on public.support_requests
 for each row execute function public.ln_support_rate_limit();
-- Restrict clients to approved insertion fields. They cannot change ticket status.
revoke all on table public.support_requests from public,anon,authenticated;
grant insert (id,user_id,reply_email,category,details,account_handle) on public.support_requests to anon,authenticated;
grant select on table public.support_requests to authenticated;
notify pgrst, 'reload schema';
