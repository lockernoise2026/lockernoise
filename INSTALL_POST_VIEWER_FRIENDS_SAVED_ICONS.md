# LockerNoise — Post Viewer, My Friends, Saved Posts & Icon Update

Built from the user's current LockerNoise repository uploaded October 13, 2026, with the already-prepared beta fixes preserved. **Neither Netlify nor Supabase was modified by this packaging step.**

## Installation order (avoid unnecessary Netlify build credits)

1. Keep Netlify builds paused. **Back up** the private GitHub repo using Code → Download ZIP.
2. Confirm that the **LockerNoise-only** Supabase project is selected. Run `supabase/04_unified_social_media_and_notifications.sql` if it has **not** already been installed. Do not rerun the old setup script. Verify that the `post_media` table exists in Supabase Table Editor.
3. Run `supabase/05_private_saved_posts.sql` in the LockerNoise Supabase SQL Editor. This creates a private bookmarked-posts table, with RLS restricting each member to their own bookmarks. It does not remove existing posts or friends. Check for success; do not ignore SQL warnings.
4. Upload the changed files from `LockerNoise_Additional_Features_Patch.zip` to **matching paths** in the private `lockernoise2026/lockernoise` GitHub repository. Files in `src` must go inside **src**, not the root. `index.html` goes at the root and `public/icons/*` goes under public/icons.
5. After commits are complete, activate builds and deploy **once**. Confirm the new commit ID in Netlify. Do not pay for plan upgrades just for this update.

## New functionality

- **Full post viewer:** clicking posted images opens a dark, large-photo viewer with next/previous controls for multiple photos, with the post text, reactions, comments, and a reply box alongside on desktop. On phones it stacks photo and discussion vertically. Press Escape or the X to close; keyboard arrows change images.
- **My friends:** accepted friends are listed in the sidebar under My friends and each has Chat, Blitz and Unfriend (with confirmation).
- **Saved posts:** bookmark on a post or in its full viewer; view from the Saved posts menu. Saved records sync to the LockerNoise Supabase account, visible only to that member under RLS. Unsaving removes the bookmark, not the original post.
- **Browser and shortcut icon:** favicon.ico, 16/32 PNG, Android 192/512 PNG and a safe-area 512 maskable icon are all derived from the approved LN shield. Chrome/Brave sometimes cache the old favicon or shortcut; after deployment, refresh, remove old shortcut and re-add it to test the new icon.
- The prior coordinated beta enhancements remain (five-photo gallery, short videos, comments, news, profile, notifications, and mobile menu).

## Beta verification

Run `npm test` and `npm run build` where npm dependencies are available, and check two-account permissions live. CSS and source tests alone cannot prove that the app builds or that Supabase permissions work in production. Test at least:
- Sign in → Home → tap a photo posted by either member → next photo → comment → close on desktop and phone.
- Check My friends list, send a private message and Blitz a friend, then Unfriend and confirm the count decreases.
- Save another member’s post → Saved posts → refresh → it remains; log into a different user and verify it does not appear.
- Verify all three color themes, read notifications, launch splash, new media posts and the registration screen.
- Install browser shortcut only **after** latest deployment, then verify LN shield icon and app display name.

## Important limits

This is **still a beta**. Profile privacy and public media links are not fully protected; sports-team logos may require permission; short videos need server-side duration enforcement and moderation before public launch. Keep Netlify access private while testing. No Apple app development is included.
