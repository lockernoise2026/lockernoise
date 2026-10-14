import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isAcceptedFriendsPost,isNetworkPost} from '../src/friendsFeed.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const app=read('../src/App.jsx'),support=read('../src/SupportCenter.jsx'),splash=read('../src/LaunchSplash.jsx'),sql=read('../supabase/10_help_support_requests.sql');
test('Friends feed excludes own posts but includes friends and their reshares',()=>{
 const friends=new Set(['a','b']);
 assert.equal(isAcceptedFriendsPost({author_id:'me'},true,'me',friends),false);
 assert.equal(isAcceptedFriendsPost({author_id:'a'},true,'me',friends),true);
 assert.equal(isAcceptedFriendsPost({author_id:'a',shared_post_id:'other'},true,'me',friends),true);
 assert.equal(isAcceptedFriendsPost({author_id:'outsider'},true,'me',friends),false);
 assert.equal(isNetworkPost({author_id:'me'},true,'me',friends),true);
 assert.equal(isNetworkPost({author_id:'outsider'},true,'me',friends),false);
});
test('friends demo respects accepted friend handles and excludes self',()=>{
 assert.equal(isAcceptedFriendsPost({author:{handle:'owner'}},false,null,null,'owner',['friend']),false);
 assert.equal(isAcceptedFriendsPost({author:{handle:'friend'}},false,null,null,'owner',['friend']),true);
 assert.equal(isAcceptedFriendsPost({author:{handle:'stranger'}},false,null,null,'owner',['friend']),false);
});
test('Friends tab has friends-only filter while main feed retains owner posts',()=>{
 assert.match(app,/view==='friends'\?visiblePosts\.filter\(isFriendPost\)/);
 assert.match(app,/visiblePosts\.filter\(isNetworkPostItem\)/);
 assert.match(app,/isAcceptedFriendsPost/);
});
test('Help is available to members and to users unable to sign in',()=>{
 assert.match(app,/Help & Support<\/MenuIcon>/);
 assert.match(app,/Need help\? Contact support/);
 assert.match(app,/from\('support_requests'\)\.insert/);
 assert.match(support,/Email address for our reply/);
 assert.match(support,/My support requests/);
 assert.match(support,/Report a Bug/);
 assert.match(support,/Support request received/);
});
test('Support database enforces restricted access and does not grant client ticket updates',()=>{
 assert.match(sql,/enable row level security/);
 assert.match(sql,/for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/);
 assert.match(sql,/for insert to anon with check \(user_id is null/);
 assert.match(sql,/for insert to authenticated with check \(user_id = \(select auth\.uid\(\)\)\)/);
 assert.match(sql,/grant insert \(id,user_id,reply_email,category,details,account_handle\)/);
 assert.doesNotMatch(sql,/grant update /i);
 assert.match(sql,/interval '15 minutes'/);
});
test('no splash CTA survives; fallback is silent if autoplay is blocked',()=>{
 assert.doesNotMatch(splash,/audio-toggle|onPlaySound|soundBlocked/);
 assert.match(app,/audio\.play\(\)\.catch\(\(\)=>\{\}\)/);
});
