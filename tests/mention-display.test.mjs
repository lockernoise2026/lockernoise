import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTaggedText, visibleMentionName, mentionsInPost } from '../src/friendTags.js';

test('display names replace opaque handles while keeping the linked account ID', () => {
 const friend={id:'account-123', handle:'fanb7f42650d41a',display_name:'Brockbowersfan72'};
 const parts=splitTaggedText('Hi @fanb7f42650d41a tomorrow', [friend]);
 const mention=parts.find(p=>p.type==='mention');
 assert.equal(visibleMentionName(mention.person),'@Brockbowersfan72');
 assert.equal(mention.person.id,'account-123');
 assert.deepEqual(mentionsInPost('Hi @fanb7f42650d41a tomorrow',[friend]).map(p=>p.id),['account-123']);
});
test('fallback displays recognizable existing handle if no display name exists',()=>{
 assert.equal(visibleMentionName({handle:'footballfan'}),'@footballfan');
 assert.equal(visibleMentionName({display_name:'  Fan Name  ',handle:'x'}),'@Fan Name');
});
