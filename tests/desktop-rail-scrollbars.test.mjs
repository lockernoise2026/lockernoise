import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/themes.css', import.meta.url),'utf8');
test('Desktop-only sidebar and right rail hide scrollbar tracks',()=>{
 assert.match(css, /@media\s*\(min-width:\s*801px\)/);
 assert.match(css, /\.app-layout\s*>\s*\.sidebar/);
 assert.match(css, /\.app-layout\s*>\s*\.rightbar/);
 assert.match(css, /scrollbar-width:\s*none/);
 assert.match(css, /::-webkit-scrollbar/);
});
test('Scroll is preserved, not replaced with overflow hidden',()=>{
 const scoped=css.slice(css.lastIndexOf('/* Desktop rail polish'));
 assert.doesNotMatch(scoped, /overflow\s*:\s*(hidden|clip)/);
 assert.doesNotMatch(scoped, /overflow-y\s*:\s*(hidden|clip)/);
});
