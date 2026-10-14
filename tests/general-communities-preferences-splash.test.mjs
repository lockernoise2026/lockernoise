import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {TEAMS,getTeam} from '../src/teams.js';
import {validFeedSort} from '../src/feedPreferences.js';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const splash=readFileSync(new URL('../src/LaunchSplash.jsx',import.meta.url),'utf8');
const pickerCss=readFileSync(new URL('../src/themes.css',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/09_general_communities_and_feed_sort.sql',import.meta.url),'utf8');
test('two league-wide communities exist with database-valid ids',()=>{
 for(const id of ['NFL_ALL','CFB_ALL']){
  const t=getTeam(id);
  assert.ok(t?.isGeneral&&t.id.length<=8);
 }
 assert.equal(TEAMS.filter(t=>t.league==='NFL'&&!t.isGeneral).length,32);
 assert.equal(TEAMS.filter(t=>t.isGeneral).length,2);
});
test('general discussion categories are not included among favorite team choices',()=>{
 assert.match(app,/const options=TEAMS\.filter\(t=>!t\.isGeneral/);
 assert.match(app,/renderOptions\(generals,'General discussions'\)/);
 assert.match(app,/renderOptions\(favorites,'My favorite teams'\)/);
 assert.match(app,/renderOptions\(others,'All NFL and college teams'\)/);
 assert.match(app,/favoriteIds=\{/);
});
test('feed sorting uses an allowlist and is saved to member profile',()=>{
 for(const value of ['hot','new','top'])assert.ok(validFeedSort(value));
 for(const value of ['banana','',null,undefined])assert.ok(!validFeedSort(value));
 assert.ok(app.includes('async function chooseSort(next)'));
 assert.ok(app.includes('feed_sort:next'));
 assert.ok(app.includes('setSort(data.feed_sort)'));
 for(const option of ['hot','new','top'])assert.ok(app.includes(`chooseSort('${option}')`));
 assert.match(migration,/ADD COLUMN IF NOT EXISTS feed_sort/);
 assert.match(migration,/CHECK \(feed_sort IN \('hot','new','top'\)\)/);
});
test('intro clip starts automatically where browser permits, without tap-to-hear button',()=>{
 assert.ok(statSync(new URL('../public/audio/lockernoise-intro.mp3',import.meta.url)).size>10000);
 assert.ok(app.includes("new Audio('/audio/lockernoise-intro.mp3')"));
 assert.ok(app.includes('audio.play().catch(()=>{})'));
 assert.ok(app.includes("document.addEventListener('pointerdown',firstInteraction"));
 assert.ok(!splash.includes('Tap to play intro sound'));
 assert.ok(!splash.includes('onPlaySound'));
 assert.ok(app.includes('introSoundEnabled'));
});
test('scrollbar cleanup is desktop-only and does not disable sidebar scrolling',()=>{
 assert.match(pickerCss,/@media \(min-width: 801px\)/);
 assert.match(pickerCss,/\.app-layout > \.sidebar::-webkit-scrollbar/);
 assert.ok(!pickerCss.includes('overflow:hidden!important'));
});
