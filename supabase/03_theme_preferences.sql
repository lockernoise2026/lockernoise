-- LockerNoise ONLY: run after setup.sql and 02_social_foundation.sql
-- Do not run in any existing business / Trinity Crafters Market database.
-- One shared preference per member for website and Android client.
ALTER TABLE public.profiles
 ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'electric';
ALTER TABLE public.profiles
 DROP CONSTRAINT IF EXISTS profiles_theme_check;
ALTER TABLE public.profiles
 ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('electric','dark','light'));
-- Existing profiles owner-write RLS from setup.sql applies to this field.
