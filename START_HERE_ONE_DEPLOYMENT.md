# LockerNoise — One Combined Update (13 Oct 2026)

Prepared from the **lockernoise-main.zip** repository you uploaded. This one patch includes the previously discussed changes and the newest requests. It has **not** been uploaded or deployed on your behalf.

## Install the database changes first — no Netlify credits

1. Confirm that the top of the Supabase dashboard says **lockernoise** under **lockernoise2026's Org**. Do not use Trinity Crafters Market.
2. Open SQL Editor and run `supabase/04_unified_social_media_and_notifications.sql` **only if it has not already been run**. This adds multi-photo/video metadata, a short bio, and Blitz read status. Do not run the old `setup.sql` again.
3. Open a new SQL query and run `supabase/05_private_saved_posts.sql`. This creates the personal bookmarks table with row-level security so only a logged-in member sees their own saved-post records. The script doesn't delete any posts, friendships, or accounts.
4. Confirm the SQL scripts report success. If Supabase reports any error, **stop and send the exact error** before deploying.

## Make one GitHub commit

1. Leave Netlify builds paused. Save a backup ZIP of your existing `lockernoise2026/lockernoise` GitHub repository.
2. Extract the `LockerNoise_One_Deployment_Update.zip` package. Copy its files and folders **into the matching paths in the existing repository**, preserving their directory structure. Do not upload the ZIP itself. In particular, replace `src/App.jsx` **inside `src`**, not the unrelated `App.jsx` at GitHub's root.
3. Commit all changes once, then activate/trigger **one** Netlify build if no build starts. Confirm the new deployment uses that commit ID.
4. Open the site, hard-refresh, and test with your two existing accounts. Old browser home-screen shortcuts may cache the icon; remove and re-add after the new build.

## Improvements included in this single update

- Tap any posted photo (including your own) to open a **full Facebook-style post viewer**: large photo + comments/reactions/post details alongside it on desktop; vertically stacked on phones. Swipe-like next/previous buttons for up to five photos, with Escape and close button.
- **My Friends** sidebar page: list accepted friends, Chat, Blitz, Unfriend (with confirmation).
- **Saved Posts** sidebar page: tap Save/Unsave on a post, saved posts follow the account and use Supabase row-level security.
- Proper approved **LN shield favicon and PWA home-screen icon** (including Android maskable variant, manifest and favicon.ico).
- Prior combined features: five-image posts; one up-to-five-minute video; improved home news quantity; My Profile page and edit controls; inline comments; mobile-sidebar backdrop close; notification improvements; fixes unauthenticated feed access error. The animated launch splash remains unchanged.

## Validation and release boundary

- Automated source tests pass; CSS parses; both ZIP archives pass integrity checks.
- A full Vite production build and live account/database tests were **not** possible here, and must be checked after deployment.
- Keep the site private while verifying member privacy, media sharing, moderation, and trademark/logo permissions. Public media file URLs and client-side video length limits are **not** production-grade privacy or media enforcement.
- No unrelated Netlify, GitHub, Supabase, or Trinity Crafters Market resources were changed by preparing this package.
