# LockerNoise — Development Roadmap

**Updated:** October 12, 2026 (US Eastern)  
**Status:** Product plan; not confirmation that planned features are coded, tested, deployed, or available to the public.  
**Working name:** LockerNoise; `lockernoise.net` availability/ownership and trademark clearance are not confirmed.

## Product direction

LockerNoise is a mobile-first, football-centered social network for NFL and college football fans, with expansion to other sports later. Keep the approved **electric-blue, neon-lime, and white** visual direction. Every structured team-name display must use a reusable team logo/badge adjacent to its name; official branded graphics require appropriate commercial-use rights before public launch.

## Delivery order

| Priority | Release stage | Feature | Dependencies | Completion criteria |
|---|---|---|---|---|
| P0 — launch foundation | Before public beta | Accounts, favorite teams, feeds, friends, privacy, DMs, moderation & security | Dedicated database; authenticated APIs; RLS; storage policies; notifications; admin tooling | Real signup/email verification; choose multiple NFL and college favorites; friend requests; feed of friends + attributed news; private/public profiles with enforced visibility; friend-only private messages; block/report; tested moderation and abuse controls |
| **P1 — flagship** | First feature release after P0 | **GameDay Live** | Verified NFL/college schedules, matchup IDs and scores; live events or polling; moderation | Every available scheduled game has one discussion room; kickoff/status/score shown with timestamp; room comments update in near-real time; users can join, react, report and mute; degraded mode for delayed/unavailable feeds |
| **P2 — flagship** | Next | **Fantasy War Room** | Player database with unique IDs and current roster/team mapping; licensed/authorized player-stat and injury feeds | Search players, position filters, player profiles, weekly/season statistics, latest updates with source/timestamps; fantasy scoring selector (standard, half-PPR, PPR); player watchlist; Start/Sit and waiver-wire discussion threads |
| **P3 — engagement** | Next | **Pick'em Challenge** | Reliable NFL schedule/status/final scores; game lock rules; grading service | Free weekly NFL winner picks; lock each game at kickoff; settle picks from confirmed final results; leaderboard for weekly and season records; tie/postponement/cancellation rules published; friends ranking |
| **P4 — retention** | Next | **Fan Reputation & Badges** | Verifiable events; anti-spam and anti-farming safeguards; badge awarding process | Profile badge showcase, Founding Member badge for first 1,000 verified eligible members, game-day participation badges, pick'em milestones; opt-out from public badge display; audit-friendly award rules |

## P0 — public-beta foundations (not optional)

- **Accounts and onboarding:** Everyone who posts, follows, chats, or makes picks must create an account. Email verification and abuse screening. Show all 32 NFL teams as a searchable multi-select logo grid, allow one primary team; then show searchable college teams with multiple choices; members may change selections later.
- **Feed and fan communities:** Prioritize accepted friends' posts on Home; insert a small, variable selection of timely NFL and college news cards attributed to publishers; separate Friends Only, My Teams, NFL, College, and team-specific communities. No false portrayal of news as user-generated posts.
- **Social tools:** Friend requests/acceptance, text/photo posts, comments, voting, notifications. User profiles have **Public** and **Private** settings. Private profiles restrict personal-profile content to approved friends; public team-community posts remain public with a clear posting warning.
- **Friends chat:** Authenticated one-to-one chat only between accepted friends by default; unread counts; reporting, blocking, privacy controls, rate limits and message retention rules. Enforce access on the server/database, not merely by hiding controls.
- **Blitz:** Poke-inspired friend-only action: **Blitz**, **Blitz Back**, and optional streaks/leaderboards. Support opt-out, cooldown, blocking, and notification preferences. Treat counts as low-stakes social play, never as wagering.
- **Safety & launch:** Admin moderation queue, removal process, report handling, account and media abuse controls, age-appropriate policy decisions, accessible UI, rate limits, pagination, security testing, legal/terms/privacy policies, and data/licensing arrangements. Add backups, monitoring and a reasonable growth budget.

## P1 — GameDay Live specification

1. One canonical discussion page per game (`league + provider_game_id`), accessible from team pages, schedules and the Home feed.
2. Scoreboard: opponent names plus logos, start time in viewer's time zone, game clock/period/status and provenance timestamp where provider supports them.
3. Real-time or efficiently polled comments, emoji reactions, topical polls (non-wagering), a report control, moderator hide/mute powers and slow mode for high-volume games.
4. Featured game room and notifications for friends who join; notification opt-in only.
5. Clear indication if a score/news feed is delayed; do not fabricate missing stats or imply official affiliation.

## P2 — Fantasy War Room specification

1. NFL player directory by name, position, team, and availability status; player profile includes team badge adjacent to name, position, bye week, opponent and current verified updates.
2. Weekly and season stats, fantasy point calculations from documented scoring rules; PPR/half-PPR/standard and (later) customizable scoring. Show update time, data attribution, and the gap between observed data and any projections.
3. Player watchlists, optional notifications, latest injury/participation updates where authorized, player discussions and Start/Sit + trade + waiver-wire community categories.
4. Later integration ideas: import external fantasy rosters/leagues through authorized APIs and explicit user consent; never require users to give us passwords for third-party fantasy services.

## P3 — Pick'em Challenge specification

1. NFL weekly slate (add college games later if rights/feeds support it); choose a winner for each game, with private picks until game lock optional.
2. Server-side game-by-game locking at scheduled actual kickoff (adjust for schedule changes). Rules for ties, postponed games, cancellations, or incomplete games must be fixed before launch.
3. Grade from finalized provider results; support automatic recomputation if a provider corrects official final status.
4. Weekly, season and friends-only leaderboards; clear records and tiebreak rules. **Free play only: no payments, stakes, wagering, or gambling payouts.**

## P4 — Fan Reputation & Badges specification

1. Initial badges: Founding Member (first 1,000 eligible verified registrations), Loyal Fan (participation), GameDay Regular (eligible game-room attendance), Pick'em Streak, and Helpful Fan (quality/community contribution).
2. Anti-abuse logic: no awards for spam volume, fake accounts, or self-generated engagement. Moderate and audit awards; avoid rewards that incentivize harassment.
3. Badges appear on member profile and can optionally accompany posts; private profiles retain visibility restrictions.

## Technical implementation notes

- Use separate Supabase schemas/tables (or services) for `games`, `game_room_messages`, `players`, `player_stats`, `player_watchlists`, `pickem_weeks`, `pickem_picks`, `pickem_results`, `badge_definitions`, `user_badges`, and user notification preferences; use server-side ingestion jobs for trusted provider feeds. These tables **do not exist yet** in the starter schema.
- Enforce row-level security for all exposed tables; use server-only credentials for provider ingestion and result grading; make feed/pick updates idempotent; guard friend-only chat and private-profile reads at the data level.
- Choose a licensed or explicitly authorized feed for commercial sports data, photos, league logos and college marks before public launch. Evaluate vendor costs, quotas, permitted caching, delays and sublicensing/redistribution restrictions. Existing demo team logos are placeholders/evaluation assets.
- For reliability: cache schedules, differentiate completed vs delayed games, queue notifications, paginate chat/comment threads, monitor live-message throughput, and use sane rate limits.

## Delivery tracking

| Item | Current state |
|---|---|
| Starter site with NFL/college team directories, local demo feed, optional Supabase integrations | **Existing prototype** |
| News mix, friend requests, onboarding team multi-select | **Existing prototype / requires deployment verification** |
| Electric-blue/neon-lime rebrand | **Design mockup approved; production CSS not yet validated** |
| Private/public profile enforcement, friends' direct messaging, Blitz | **Planned; not yet implemented or tested** |
| GameDay Live | **Planned — Priority P1** |
| Fantasy War Room | **Planned — Priority P2** |
| Pick'em Challenge | **Planned — Priority P3** |
| Fan Reputation & Badges | **Planned — Priority P4** |
| Production launch, data provider license, approved team logos, live Netlify/Supabase integration | **Not completed** |

## Suggested next sprint

**Sprint A:** Create a fresh dedicated production-capable Supabase project and staging environment, finish verified signup/onboarding and add explicit profile-visibility rules. Test two distinct accounts and all private/public read permissions. **Sprint B:** Friend-only DMs and notifications, block/report and moderation tools; then Blitz. **Sprint C:** Live game catalog and GameDay Live discussion rooms, starting with NFL and then college football.

## Sprint 1 local progress (October 12, 2026)

- [x] Rebranded React header to LockerNoise and applied electric blue/lime CSS in a separate working copy.
- [x] Prepared web-app manifest and Android Capacitor configuration.
- [x] Added message-list UI, composing messages to accepted friends, and friend Blitz actions in local React code.
- [x] Added database script for missing onboarding fields and friend-only RLS policies for messages and Blitz.
- [ ] Verify schema against newly created LockerNoise Supabase project and test with two real verified accounts.
- [ ] Add server-enforced private-profile personal-detail protection, blocking/reporting UI, rate limits and moderation workflows.
- [ ] Complete npm install, full React build, browser QA, signing and Android device testing.
- [ ] Connect the new isolated GitHub/Netlify/Supabase accounts and obtain explicit cost approval before any deployment.

None of the unchecked items are implied complete by the code files above.


### Appearance preferences — Sprint 1 enhancement

- [x] Three color palettes: Electric Blue + Lime (default); Dark + Lime; White + Lime.
- [x] Instant theme changes in website preview and React UI, accessible from top bar and profile settings.
- [x] Browser/device local preference persistence.
- [x] Optional cross-device account synchronization code plus additive migration `03_theme_preferences.sql`.
- [ ] Deploy the new dedicated database and verify cross-device synchronization using separate test devices after user approves new accounts and costs.
- [ ] Accessibility and full browser/Android smoke tests before public launch.
