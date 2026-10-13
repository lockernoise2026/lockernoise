# LockerNoise — coordinated mobile, social, media & news update

Source: current `lockernoise-main.zip` uploaded 2026-10-13. This is NOT a deployment; your live Netlify and Supabase projects remain unchanged.

## Before touching GitHub

1. Keep automatic Netlify builds **paused** to avoid multiple credits/deploys.
2. Save a backup of your current GitHub repository ZIP. This updated package itself includes the baseline and modified source.
3. In **your separate LockerNoise Supabase project only**, open SQL Editor and review/run `supabase/04_unified_social_media_and_notifications.sql`.
4. Confirm the SQL returned success before deploying the website. The new client code expects the `post_media`, `profiles.bio`, and `blitzes.read_at` fields. Do not run SQL in Trinity Crafters Market or Your Cruise Guy.

## Single GitHub upload / deployment

Update these files in the existing **lockernoise2026/lockernoise** repository, preserving each exact path:

- `src/App.jsx` — replaces old `src/App.jsx`, **not** the unrelated `App.jsx` at repository root
- `src/themes.css` — replaces old `src/themes.css` (includes all existing visual fixes and new UI styles)
- `netlify/functions/news.mjs` — replaces old function, improves headline coverage/deduplication
- `index.html` — fixes app manifest/favicon references
- `public/manifest.webmanifest` — adds web-app manifest
- `tests/foundation.test.mjs` and `tests/ux-update.test.mjs` — optional automated tests
- `supabase/04_unified_social_media_and_notifications.sql` — archive in repo for future reference **after** running in LockerNoise Supabase

Do not upload the root-level `App.jsx` or any old full-project ZIP over this patch. Do not modify the current logo, splash animation, team logo settings, message code or existing database records.

Now activate builds and **trigger exactly one Netlify deploy**, if no build starts itself. Verify the production deployment uses the newest commit ID. On the site, test sign-up and signed-in mobile layouts in a fresh tab.

## What changed

- Unauthenticated registration route no longer reads protected posts; retains database security.
- “My profile” page from menu and header avatar, with bio, teams and posts; Edit profile opens settings. Note: existing visibility setting is not yet a complete privacy enforcement mechanism.
- Mobile menu closes with an outside tap/backdrop, Escape, or route selection.
- Post comments preview inline; members can expand and reply without leaving the feed.
- Blitz read status syncs via recipient-only database writes, and message notifications respect `read_at`. Friend requests remain pending until accepted/declined.
- Home feed mixes up to 12 available recent real headlines initially (or fewer if feeds do not return enough); Load More adds 12 at a time. The news function checks additional keyword feeds and de-duplicates headlines. No stories are fabricated.
- Members can attach up to **five JPG/PNG/WebP/GIF images, 3 MB each, or one MP4/WebM video up to five minutes and 50 MB**, with browser-based duration checks, previews and in-feed playback. Existing image-only posts remain visible.

## Beta limitations / important security notes

- A verified **full Netlify/Vite build and two-account live QA are still required**. Dependencies could not be installed in the local authoring environment, but 19 source/unit checks passed and React/JSX and CSS parsed successfully.
- **Do not make the site public yet.** Existing profile privacy settings and media links are not fully private. Photos/video in public Supabase buckets can be accessed by anyone with a direct file URL. A private-member rollout needs more backend authorization work.
- 5-minute video length is checked on the client; malicious clients could bypass it. Server-side duration verification, virus scanning, moderation and quotas are needed before general launch.
- Supabase Free storage is limited: videos can use the quota quickly. No paid plan, domain, or service was added.
- News source RSS endpoints may be unreachable or return fewer than 12 articles. Keep proper attribution and original links.
- All work was local: **no changes to Trinity Crafters Market, Netlify, GitHub or Supabase accounts were performed by this package**.

## Live QA checklist

1. Sign out → verify no `permission denied for table posts` error.
2. Sign in → open **My profile**, edit bio/photo, save and reopen.
3. Phone → open hamburger → tap outside → menu closes.
4. Sign in to two test accounts → Blitz and send message → verify badge, open/read and Mark all read on both devices.
5. Post with comments → previews appear under post, View all, Reply work.
6. Home feed → multiple current headlines; Load More works when more articles are returned.
7. Attach 2–5 images → create post → grid opens images; existing photo posts still show.
8. Attach one 10-second video → plays in feed; file over 50 MB and video over 5 minutes are rejected.
9. Check electric-blue, dark, and white themes; launch splash remains unchanged.

If SQL returns an error, **stop before deploying** and share the exact error text; do not repeatedly rerun the script.
