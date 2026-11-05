import test from 'node:test';
import assert from 'node:assert/strict';
import {facebookVideoUrl,extractFacebookAttachment} from '../src/facebook.js';
const watch='https://www.facebook.com/watch?v=1234567890123';
test('pasted Facebook link detaches from typed text',()=>{
 for(const address of [`https://www.facebook.com/ESPN/videos/1234567890123/`,`https://www.facebook.com/watch?v=1234567890123&t=30`,`https://fb.watch/abcDEF123/`]){
  const got=extractFacebookAttachment(`Best touchdown ever! ${address}`);
  assert.equal(got.caption,'Best touchdown ever!');
  assert.ok(got.videoUrl===watch||got.videoUrl==='https://fb.watch/abcDEF123');
 }
});
test('pasted link alone leaves blank editable caption',()=>{
 assert.deepEqual(extractFacebookAttachment(`https://www.facebook.com/reel/1234567890123`),{videoUrl:'https://www.facebook.com/reel/1234567890123',caption:''});
});
test('URL between words keeps the rest of caption',()=>{
 assert.deepEqual(extractFacebookAttachment(`Amazing https://www.facebook.com/watch?v=1234567890123 watch this`),{videoUrl:watch,caption:'Amazing watch this'});
});
test('non-Facebook URL is not stripped',()=>{
 const t='See https://example.com/foo today';
 assert.deepEqual(extractFacebookAttachment(t),{videoUrl:null,caption:t});
 assert.equal(facebookVideoUrl(t),null);
});
test('invalid and spoofed Facebook domains are never attached',()=>{
 const t=`https://facebook.com.evil.test/watch?v=1234567890123`;
 assert.deepEqual(extractFacebookAttachment(t),{videoUrl:null,caption:t});
});
