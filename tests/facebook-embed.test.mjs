import test from 'node:test';
import assert from 'node:assert/strict';
import {facebookVideoUrl} from '../src/facebook.js';
test('Facebook watch, page video, reel, share and short links canonicalize',()=>{
 for(const [value,want] of [
  [`Check https://www.facebook.com/watch?v=1234567890123!`,'https://www.facebook.com/watch?v=1234567890123'],
  [`https://www.facebook.com/ESPN/videos/1234567890123/`,'https://www.facebook.com/watch?v=1234567890123'],
  [`https://m.facebook.com/somepage/videos/9876543210987?ref=share`,'https://www.facebook.com/watch?v=9876543210987'],
  [`https://www.facebook.com/reel/1234567890123`,'https://www.facebook.com/reel/1234567890123'],
  [`https://fb.watch/abcDEF123/`,'https://fb.watch/abcDEF123'],
  [`https://www.facebook.com/share/v/AbC123xYz/`,'https://www.facebook.com/share/v/AbC123xYz'],
  [`https://www.facebook.com/share/r/AbC123xYz/`,'https://www.facebook.com/share/r/AbC123xYz'],
 ]) assert.equal(facebookVideoUrl(value),want);
});
test('Rejects spoofed domains, non-video Facebook links and broken ids',()=>{
 for(const value of ['https://facebook.com.evil.com/watch?v=1234567890123','https://example.com/watch?v=1234567890123','https://www.facebook.com/somepage/photos/1234567890123','https://www.facebook.com/groups/1234567890123','https://www.facebook.com/watch?v=abc','https://fb.watch/','javascript:alert(1)'])assert.equal(facebookVideoUrl(value),null);
});
