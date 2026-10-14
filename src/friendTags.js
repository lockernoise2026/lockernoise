// Friend tagging uses stable account IDs in storage and readable @handles in posts.
export const mentionQuery = text => {
  const match = /(?:^|\s)@([\w.-]{0,32})$/u.exec(String(text || ''));
  return match ? match[1].toLowerCase() : null;
};
export const friendTagOptions = (text, friends, limit=7) => {
  const q=mentionQuery(text);
  if(q===null)return [];
  return (friends||[]).filter(p=>p?.id&&p?.handle&&(
    p.handle.toLowerCase().startsWith(q) || (p.display_name||'').toLowerCase().includes(q)
  )).slice(0,limit);
};
export const insertFriendTag = (text,handle) => String(text||'').replace(/(^|\s)@[\w.-]{0,32}$/u, (_,prefix)=>prefix+'@'+handle+' ');
export const mentionsInPost = (text,friends) => (friends||[]).filter(p=>p?.id&&p?.handle && new RegExp('(^|[^\\p{L}\\p{N}_])@'+p.handle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^\\p{L}\\p{N}_.-])','iu').test(String(text||'')));
export function splitTaggedText(text,taggedUsers){
 const value=String(text||''), people=(taggedUsers||[]).filter(p=>p?.id&&p?.handle).sort((a,b)=>b.handle.length-a.handle.length);
 const result=[];let index=0;
 while(index<value.length){let winner=null;
  for(const p of people){const regex=new RegExp('(^|[^\\p{L}\\p{N}_])@('+p.handle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=$|[^\\p{L}\\p{N}_.-])','giu');regex.lastIndex=index;const m=regex.exec(value);if(m){const pos=m.index+m[1].length;if(!winner||pos<winner.from)winner={from:pos,to:pos+1+m[2].length,person:p};}}
  if(!winner){result.push({type:'text',value:value.slice(index)});break;}
  if(winner.from>index)result.push({type:'text',value:value.slice(index,winner.from)});
  result.push({type:'mention',value:value.slice(winner.from,winner.to),person:winner.person});index=winner.to;
 }
 return result;
}
