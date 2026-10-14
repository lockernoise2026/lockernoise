import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/themes.css',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/06_reactions_shares_comments_editing.sql',import.meta.url),'utf8');
test('every social post supports authored text editing, not user-facing deletion',()=>{
 for(const needle of ['Edit your post','async function saveEdit','Edited ·','onEdit={','GRANT UPDATE(body)','REVOKE UPDATE,DELETE ON public.posts FROM authenticated']) assert.ok(app.includes(needle)||sql.includes(needle),needle);
 assert.ok(!app.includes('Delete Post')&&!app.includes('Delete post'));
});
test('reactions persist under per-member RLS and preserve old votes',()=>{
 for(const needle of ['post_reactions','onReact','ReactionPicker','INSERT INTO public.post_reactions','FROM public.votes','Members change their reactions','user_id=(SELECT auth.uid())'])assert.ok(app.includes(needle)||sql.includes(needle),needle);
});
test('comment and direct-reply alerts are tied to recipients and server-created',()=>{
 for(const needle of ['CREATE TABLE IF NOT EXISTS public.activity_notifications','Only recipients see activity alerts','lockernoise_notify_new_comment','AFTER INSERT ON public.comments','onPost={openPostNotification}','parent_comment_id:parentId','read_at:new Date().toISOString()'])assert.ok(app.includes(needle)||sql.includes(needle),needle);
});
test('reshares reference original authors and link sharing remains available',()=>{
 for(const needle of ['shared_post_id','SharedPostPreview','Share to my timeline','copyPostLink','openShare(post)','posts_shared_source_idx','Posts from private profiles cannot be reshared'])assert.ok(app.includes(needle)||sql.includes(needle),needle);
});
test('member profile and mobile navigation plus friends button layout',()=>{
 for(const needle of ['openMemberProfile','loadMemberPosts','Load more posts','onProfile={openMemberProfile}'])assert.ok(app.includes(needle),needle);
 assert.ok(css.includes('.person-row>.friend-actions{grid-column:1/-1'));
});
test('splash screen audio not added in this update',()=>{
 assert.ok(!app.includes('new Audio('));
 assert.ok(!app.includes('soundOnSplash'));
});
