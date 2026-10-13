import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('src/App.jsx'),css=read('src/themes.css'),sql=read('supabase/05_private_saved_posts.sql'),manifest=JSON.parse(read('public/manifest.webmanifest')),html=read('index.html');
test('posted photos open a photo and conversation viewer',()=>{
 assert.match(app,/post-gallery-photo/);
 assert.match(app,/onClick=\{\(\)=>setDetailIndex\(i\)\}/);
 assert.match(app,/post-detail-comments/);
 assert.match(app,/post-detail-reply/);
 assert.match(css,/\.post-detail-dialog/);
 assert.match(css,/@media\(max-width:780px\)/);
});
test('friends are listed with chat blitz and an unfriend option',()=>{
 assert.match(app,/view==='friendlist'/);
 assert.match(app,/acceptedFriends\.map/);
 assert.match(app,/Unfriend/);
 assert.match(app,/onMessage=\{startMessage\}/);
 assert.match(app,/onBlitz=\{blitzFriend\}/);
});
test('saved posts are member-only with RLS on the server',()=>{
 assert.match(app,/view==='saved'/);
 assert.match(app,/\.from\('saved_posts'\)/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/user_id=\(SELECT auth\.uid\(\)\)/);
 assert.match(sql,/REFERENCES public\.posts\(id\) ON DELETE CASCADE/);
 assert.doesNotMatch(sql,/GRANT SELECT.* TO anon/i);
});
test('browser favicon and app shortcut have correct square LN assets',()=>{
 assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));
 assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'));
 assert.match(html,/favicon\.ico/);
 assert.match(html,/manifest\.webmanifest/);
});
