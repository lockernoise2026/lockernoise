import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEAMS} from '../src/teams.js';
test('team directory contains 32 NFL teams and image references',()=>{
 assert.equal(TEAMS.filter(t=>t.league==='NFL').length,32);
 assert.ok(TEAMS.filter(t=>t.league==='CFB').length>50);
 assert.ok(TEAMS.every(t=>t.logo?.startsWith('https://')));
 assert.match(TEAMS.find(t=>t.id==='WAS').logo,/wsh\.png$/);
});
test('official logo display requires explicit mode',()=>{
 const code=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.ok(code.includes("VITE_TEAM_LOGO_MODE || 'initials'"));
 assert.ok(code.includes("teamLogoMode==='private-preview'"));
 assert.ok(code.includes("VITE_LOGOS_LICENSED==='true'"));
});
