import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const read = rel => readFileSync(new URL(rel, root), 'utf8');
test('required onboarding columns and consent-based social messaging defined', () => {
 const sql=read('supabase/02_social_foundation.sql');
 for(const value of ['favorite_nfl_teams','favorite_cfb_teams','onboarding_completed','profile_visibility','allow_blitz','direct_messages','blitzes','blocks']) assert.ok(sql.includes(value), value);
 assert.match(sql,/create policy "Only accepted friends can message"/);
 assert.match(sql,/create policy "Only consenting friends can be blitzed"/);
 assert.match(sql,/revoke select on public\.profiles, public\.posts, public\.votes, public\.comments from anon/);
});
test('brand and Android preparation files present',()=>{
 const app=read('src/App.jsx'); assert.match(app,/className="brand-lockup"/);
 assert.match(app,/function MessageCenter/);
 assert.match(app,/function blitzFriend/);
 assert.match(app,/view==='messages'/);
 assert.equal(JSON.parse(read('capacitor.config.json')).appName,'LockerNoise');
 assert.equal(JSON.parse(read('public/manifest.webmanifest')).short_name,'LockerNoise');
});
