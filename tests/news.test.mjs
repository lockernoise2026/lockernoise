import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/news.mjs';
const originalFetch=globalThis.fetch;
const now=new Date().toUTCString();
const payload=`<?xml version="1.0"?><rss><channel><item><title><![CDATA[Buccaneers and &amp; rivals]]></title><link>https://example.org/story</link><pubDate>${now}</pubDate></item></channel></rss>`;
test('NFL and college RSS parsing keeps source attribution and valid links',async()=>{
 globalThis.fetch=async()=>new Response(payload,{status:200});
 try{const res=await handler();const {items}=await res.json();assert.equal(res.status,200);assert.equal(items.length,1);assert.equal(items[0].source,'ESPN');assert.equal(items[0].title,'Buccaneers and & rivals');assert.equal(items[0].url,'https://example.org/story');}
 finally{globalThis.fetch=originalFetch;}
});
test('when ESPN is unavailable the endpoint tries Google News',async()=>{
 globalThis.fetch=async(url)=>String(url).includes('espn.com')?new Response('',{status:403}):new Response(payload,{status:200});
 try{const res=await handler();const {items}=await res.json();assert.equal(res.status,200);assert.equal(items.length,1);assert.equal(items[0].source,'Google News');}
 finally{globalThis.fetch=originalFetch;}
});
