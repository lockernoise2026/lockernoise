import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const launch=readFileSync(new URL('../src/LaunchSplash.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/splash.css',import.meta.url),'utf8');
test('LN splash runs before sign-in and waits for auth',()=>{
 assert.match(app,/if\(!splashFinished \|\| !authReady\)return <LaunchSplash/);
 assert.match(app,/supabase\.auth\.getSession\(\)/);
});
test('approved LN assets animate then burst',()=>{
 assert.match(launch,/splash-shield\.png/);
 assert.match(launch,/splash-wordmark\.png/);
 assert.match(css,/@keyframes ln-shield-spin/);
 assert.match(css,/@keyframes ln-particle/);
});
test('reduced motion uses static logo',()=>{
 assert.match(css,/prefers-reduced-motion:reduce/);
});
