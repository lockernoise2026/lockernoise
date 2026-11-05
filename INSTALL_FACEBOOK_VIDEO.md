# Facebook Video Attachments — Install

Paste a Facebook video link into a post and it now behaves exactly like a
YouTube link: the video attaches, the raw URL leaves the caption, and you
write your own words. Works for facebook.com/watch and /videos/ links,
Reels, facebook.com/share links, and fb.watch short links (public videos).

## Step 1 — Run the database update FIRST

In your Supabase project: **SQL Editor → New query**, paste the entire
contents of `supabase/11_facebook_video_url.sql`, and run it.

> Run this BEFORE deploying the new site code. The new code saves the
> video in a new `facebook_video_url` column on `posts`; if the column
> isn't there yet, posting will fail until the SQL has run. (Same drill
> as migration 07 for YouTube.)

## Step 2 — Deploy the updated site

Deploy this source the usual way (Netlify). Existing posts, YouTube
attachments, comments, and reactions are untouched.

## Step 3 — Android app (when you're ready)

Rebuild the Android app from this same source (Capacitor sync + build)
so the phone app picks up Facebook attachments too.

## Notes

- One video per post: pasting a Facebook link replaces a YouTube
  attachment and vice versa, same as before.
- Only public Facebook videos play in the embedded player; a private or
  age-restricted video shows Facebook's own notice inside the player.
- Non-video Facebook links (photos, groups, profiles) are left as
  ordinary text links, never attached.
