# LockerNoise team logos — private preview update

This update changes the default logo switch (previously team initials unless VITE_LOGOS_LICENSED=true).

To use on the **private** LockerNoise development website:

1. Extract this ZIP on your computer.
2. In GitHub, open the new `lockernoise2026/lockernoise` repository.
3. Replace `src/App.jsx` and `src/teams.js` with these updated versions (keep the `src` path); optionally upload `tests/logo-mode.test.mjs` under `tests`.
4. In the new LockerNoise Netlify site (not the Trinity account), add environment variable `VITE_TEAM_LOGO_MODE` with value `private-preview`.
5. Trigger a new deploy (or let the GitHub commit trigger it), then refresh the site.

The logos come from external ESPN image addresses and may fail to load, in which case the app automatically falls back to initials. An image address is NOT an asset license. Use the preview setting only while testing privately. Do not switch the site to public or use official team logos in a public/commercial release without evaluating rights with the NFL, the relevant colleges, and counsel. The public production setting can use `licensed` only after rights approval AND `VITE_LOGOS_LICENSED=true`; otherwise it falls back to initials.

No database change, new services, or billing changes are required.
