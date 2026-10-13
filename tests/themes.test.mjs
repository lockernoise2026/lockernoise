import test from 'node:test';
import assert from 'node:assert/strict';
import {THEMES,validTheme,savedTheme,THEME_STORAGE_KEY} from '../src/themes.js';
test('only the 3 approved themes are offered', () => {
 assert.deepEqual(THEMES.map(x=>x.id), ['electric','dark','light']);
 assert.equal(validTheme('electric'),true);
 assert.equal(validTheme('dark'),true);
 assert.equal(validTheme('light'),true);
 assert.equal(validTheme('purple'),false);
});
test('defaults safely if storage is unavailable', () => {
 assert.equal(savedTheme(),'electric');
});
test('uses existing local selection when valid',()=>{
 globalThis.localStorage={getItem:key=>key===THEME_STORAGE_KEY?'dark':null};
 try{assert.equal(savedTheme(),'dark');localStorage.getItem=()=> 'bad-value';assert.equal(savedTheme(),'electric')}
 finally{delete globalThis.localStorage}
});
