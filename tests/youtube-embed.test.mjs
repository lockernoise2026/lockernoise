import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId} from '../src/youtube.js';
test('YouTube watch, short, share and live links',()=>{
 const id='dQw4w9WgXcQ';
 for(const value of [`Check https://youtu.be/${id}!`,`https://www.youtube.com/watch?v=${id}&t=12`,`https://m.youtube.com/shorts/${id}?si=123`,`https://youtube.com/live/${id}`]) assert.equal(youtubeId(value),id);
});
test('Rejects untrusted iframe domains and broken ids',()=>{
 for(const value of ['https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ','https://example.com/watch?v=dQw4w9WgXcQ','https://youtu.be/too-short','javascript:alert(1)'])assert.equal(youtubeId(value),null);
});
