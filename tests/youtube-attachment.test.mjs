import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId,extractYouTubeAttachment} from '../src/youtube.js';
const id='dQw4w9WgXcQ';
test('pasted YouTube link detaches from typed text',()=>{
 for(const address of [`https://youtu.be/${id}`,`https://www.youtube.com/watch?v=${id}&t=30`,`https://www.youtube.com/shorts/${id}`]){
  assert.deepEqual(extractYouTubeAttachment(`Best touchdown ever! ${address}`),{videoId:id,caption:'Best touchdown ever!'});
 }
});
test('pasted link alone leaves blank editable caption',()=>{
 assert.deepEqual(extractYouTubeAttachment(`https://youtu.be/${id}`),{videoId:id,caption:''});
});
test('URL between words keeps the rest of caption',()=>{
 assert.deepEqual(extractYouTubeAttachment(`Amazing https://youtu.be/${id} watch this`),{videoId:id,caption:'Amazing watch this'});
});
test('non-YouTube URL is not stripped',()=>{
 const t='See https://example.com/foo today';
 assert.deepEqual(extractYouTubeAttachment(t),{videoId:null,caption:t});
 assert.equal(youtubeId(t),null);
});
test('invalid and spoofed YouTube domains are never attached',()=>{
 const t=`https://youtube.com.evil.test/watch?v=${id}`;
 assert.deepEqual(extractYouTubeAttachment(t),{videoId:null,caption:t});
});
