# LockerNoise — NFL + College Football Fan Community

A mobile-first Reddit-meets-Facebook football community starter. **LockerNoise is a provisional working name only.** The user found `lockernoise.com` in use. `lockernoise.net` is a *candidate*, not confirmed registered or available. Domain access, existing-brand use, and trademark rights have **not** been cleared. A different TLD does not avoid possible trademark infringement. Conduct a clearance search before any public launch.

## Preview features

- NFL and college football team directory, including ESPN team logo URLs and colored fallbacks
- Logo and team name displayed together in **every structured team reference** and recognized team mentions in post/comment text
- Switch team feeds at any time; searchable team browser
- Favorite NFL and college teams, editable profile preferences
- Posts, photo uploads, comment threads, upvotes/downvotes, community feeds
- New/top/hot sorting and personalized feed
- Mobile layout and a sample demo feed, stored in the visitor's browser
- Optional Supabase real login, persistent public posts, photos, likes, and comments

## Product roadmap (October 2026)

See [`DEVELOPMENT_ROADMAP.md`](DEVELOPMENT_ROADMAP.md) for the prioritized plan. The four new feature priorities are **P1 GameDay Live**, **P2 Fantasy War Room**, **P3 Pick'em Challenge**, and **P4 Fan Reputation & Badges**. Secure user accounts, privacy controls, friends chat, Blitz, moderation, and licensed data are prerequisite work, not completed releases. The approved electric-blue/lime styling is implemented in the code; members can switch between Electric Blue + Lime, Dark + Lime, and White + Lime.

## Development

1. Install Node.js 20+.
2. Run `npm install` followed by `npm run dev`.
3. Open the address Vite displays. Without configuration, it works in **demo mode** with local browser storage. Demo actions do not create public accounts or save data to a server.

## Enable real public accounts and posting

1. Create a **NEW dedicated Supabase project**. Do not use an existing hotel's, travel business's, or other production database.
2. In the new project's SQL editor, run `supabase/setup.sql` once. Review the security policies before production use.
3. Enable email confirmations and configure your Supabase authentication Site URL and redirect URL to your Netlify domain. For local development include `http://localhost:5173`.
4. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and **publishable** `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a service-role/secret key in the browser.
5. Run `npm run dev` and test with two separate test accounts.
6. For Netlify: push this folder to a new GitHub repository, create a new Netlify site from the repository, set these two variables in the Netlify project's build environment, and deploy. `netlify.toml` already configures the Vite build and SPA fallback.

## Important before public launch

This is a **starter MVP**, not yet a production-ready Facebook competitor. The public beta **must not launch** until a working reports/moderation queue and admin response process, rate limiting, email abuse protection, content removal, user blocking, legal policies, image scanning, scaling/performance, and acceptable-use enforcement are implemented and tested. The Report button is explicitly a demo placeholder and does **not** submit reports. Frontend data fetching is intentionally simple and needs pagination or aggregate RPCs as activity grows. Use licensed team logo assets for a commercial public launch and review NFL/NCAA/college trademarks; ESPN image hotlinks are for evaluation only and may become unavailable.

## Team logos

Team definitions are in `src/teams.js`. NFL logos are loaded from `a.espncdn.com/i/teamlogos/nfl/500/{abbrev}.png`; college logos from `a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png`. One reusable `TeamName` component handles logos, labels, navigation lists, and posts. `RichTeamText` detects known team names in discussions and attaches their logo. An accessible two-letter team-color fallback displays if a remote logo fails. Avoid writing plain team names directly in new UI components: always use `TeamName`.

## Disclaimer

Unofficial independent fan prototype, not affiliated with or endorsed by any NFL team, college, NCAA, or ESPN.

## Friends feed + live football headlines (October 2026 update)

- **Home:** posts from accepted friends are prioritized, followed by community posts, with a random selection of recent NFL and college-football headlines inserted after every three posts. `Mix news` changes the selection, and the browser checks for updates every 10 minutes.
- **Friends feed:** shows only posts from accepted friends, **without** injected headlines.
- **Find fans:** discover people, send/accept/cancel friend requests, unfriend. In preview mode, friend connections are simulated in local storage.
- **Headlines:** `netlify/functions/news.mjs` reads ESPN's [published RSS feeds](https://www.espn.com/espn/news/story/_/id/3437834), with Google News RSS as fallback when ESPN feeds are blocked. It shows linked headlines with publisher attribution; no full article reproduction. In plain Vite local development without Netlify Dev, the app will explicitly say live news is unavailable. Production Netlify deploys serve the news endpoint automatically. To test locally with functions, use `netlify dev` rather than only `npm run dev`.
- **Database:** `supabase/setup.sql` now creates a `friendships` table with participant-only read access, request/accept permissions, and unfriend support. The current design limits the directory to the 150 newest users; add paginated search before scaling.

The public beta additionally needs robust friend-request rate limiting, duplicate reverse-request prevention, moderation tools, accessible privacy controls, and rights review for team logos/news excerpts.

## Name / domain status

`LockerNoise` is a provisional project name. `lockernoise.net` is not owned or verified available. Confirm via registrar / ICANN RDAP, assess `.com` user and trademarks, and obtain legal clearance before purchase or release.

## Local Sprint 1 implementation — October 12, 2026

This local development copy updates the **website's actual CSS** to the approved electric-blue and neon-lime scheme and fixes the old FanHuddle header. It includes a basic installable-web-app manifest (`public/manifest.webmanifest` and `public/icon.svg`), `capacitor.config.json` for later Android packaging, a Messages screen and friend-only chat/Blitz entry points, and an additive Supabase SQL script.

**Use only a NEW, dedicated LockerNoise Supabase project:** Execute `supabase/setup.sql`, `supabase/02_social_foundation.sql`, and `supabase/03_theme_preferences.sql`, in that order. The second script adds the columns the existing onboarding screen expects, plus `direct_messages`, `blitzes`, and `blocks` with row-level policies. Database rules require accepted friendships to send direct messages or Blitzes and reject contact between blocked accounts. Friend-only chat uses 15-second polling as a development implementation; push notifications, unread counts, rate limits, message reporting, and true real-time transport are not done.

**Privacy limitation:** Settings now save a user's public/private *preference*, but column-level protection for private profile details and private personal-post storage is **not complete**. Public team discussions remain public. Do not invite real users or represent private profiles as secure until personal data is split and protected at the database/API layer, and two-account RLS tests pass.

### Android / Play Store

The website is prepared to become an Android app using the shared web code through Capacitor. **This ZIP does not contain a built or signed Android app or a Google Play submission.** After npm install access is available, install compatible Capacitor packages (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`), run a verified web build, add the Android project, run `npx cap sync android`, and use Android Studio/Google Play Console for testing and publishing. Check versions, Android SDK/Gradle compatibility, signing, privacy disclosures, and Google's current Play requirements first. Do not use an iOS project.

### Build checks and limitations

The remote npm registry could not be resolved in this execution environment, so package installation, React runtime smoke tests, and a release Android build **could not be completed here**. JSX is independently checked with a local TypeScript parser, and Node's built-in news-feed tests are run. This is development code, not yet a deployed website. Do not put Supabase secret/service-role keys in the client.

### Deployment hold

**No project, site, database, GitHub repository, or paid service was created or modified in the user's existing accounts.** The user will create new isolated LockerNoise accounts. Ask for those new account connections and confirm costs **before** provisioning, deployment, or publication. Never use any account, team, organization, or billing resource associated with Trinity Crafters Market.


## Three optional color themes (October 12, 2026)

The website and future Android WebView share three selectable member appearances: **Electric Blue + Lime** (default), **Dark + Lime**, and **White + Lime**. In the website, switch using the **Appearance** control in the top bar or the **Appearance** section in profile settings. The standalone `preview.html` also has a working theme menu. Switching instantly restyles the same page without modifying content or feed logic.

- Theme definitions and storage helpers: `src/themes.js`; design tokens and UI overrides: `src/themes.css`.
- Demo mode persists the choice in device `localStorage` (key `lockernoise-theme-v1`).
- For the future real website and Android app, run the additive `supabase/03_theme_preferences.sql` **only on a newly created, independent LockerNoise database**, after the other two scripts. This adds a validated `profiles.theme` value. The app writes choices to the signed-in user's profile, reads preferences on sign-in, and keeps device-local fallback if syncing fails.
- Only the theme colors change; theme does not change public/private profile visibility, post visibility, friends, saved teams, or notifications.
- Both mobile and desktop must undergo accessible contrast and keyboard testing before launch.

**Deployment unchanged:** No user account, Supabase project, Netlify team, or live website was created or modified. Existing Trinity Crafters Market resources are off-limits.
