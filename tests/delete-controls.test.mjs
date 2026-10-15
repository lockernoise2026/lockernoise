import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
test('post deletion checks ownership, prompts, and scopes server deletes to author',()=>{
 assert.match(source,/if\(!ownsPost\(post\)\)return/);
 assert.match(source,/window\.confirm\('Permanently delete this post/);
 assert.match(source,/from\('posts'\)\.delete\(\)\.eq\('id',post\.id\)\.eq\('author_id',session\.user\.id\)/);
});
test('reply and comment deletion checks ownership and scopes server deletes',()=>{
 assert.match(source,/if\(!ownsComment\(comment\)\)return/);
 assert.match(source,/from\('comments'\)\.delete\(\)\.eq\('id',comment\.id\)\.eq\('author_id',session\.user\.id\)/);
});
test('delete controls are exposed in feed, modal and inline discussion',()=>{
 assert.match(source,/onDeletePost=\{ownsPost\(item\.data\)\?deleteOwnPost:null\}/);
 assert.match(source,/onDeleteComment=\{deleteOwnComment\}/);
 assert.match(source,/canDeleteComment\?\.\(c\)/);
});
