import React,{useEffect,useMemo,useState,useRef} from 'react';
import {createClient} from '@supabase/supabase-js';
import {Home,Compass,Flame,Users,MessageCircle,ThumbsUp,ThumbsDown,Plus,Image as ImageIcon,Search,Bell,ChevronDown,Settings,LogOut,X,ArrowUpRight,ShieldAlert,Menu,Check,Heart,Camera,UploadCloud,Send,RefreshCw,Newspaper,UserPlus,UserCheck,Zap,Lock,Globe,Palette,UserRound,Video,Trash2,Bookmark,BookmarkCheck,ChevronLeft,ChevronRight,Repeat2,Copy,ExternalLink,Pencil,Clock3,Volume2,HelpCircle} from 'lucide-react';
import {TEAMS,getTeam,MENTIONS,leagueName} from './teams';
import {THEMES,THEME_STORAGE_KEY,validTheme,savedTheme} from './themes';
import LaunchSplash from './LaunchSplash.jsx';
import {youtubeId,extractYouTubeAttachment} from './youtube.js';
import {friendTagOptions,insertFriendTag,mentionsInPost,splitTaggedText} from './friendTags.js';
import {FEED_SORT_KEY,validFeedSort,savedFeedSort} from './feedPreferences.js';
import SupportCenter from './SupportCenter.jsx';
import {isAcceptedFriendsPost,isNetworkPost} from './friendsFeed.js';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const connected=Boolean(url&&key);
const supabase=connected?createClient(url,key):null;
const storeKey='lockernoise-demo-v3';
// Official team logos may only be used on the public site after brand-rights review.
// The private-preview mode is for reviewing the user interface before launch, not an IP license.
const teamLogoMode=import.meta.env.VITE_TEAM_LOGO_MODE || 'initials';
const useOfficialLogos=teamLogoMode==='private-preview' || (teamLogoMode==='licensed' && import.meta.env.VITE_LOGOS_LICENSED==='true');
const initialPosts=[
 {id:'demo-1',team_id:'TB',author_id:'demo',author:{display_name:'GridironGuru',handle:'gridironguru',favorite_nfl:'TB',favorite_cfb:'FLA'},body:'What is the biggest thing the Buccaneers need to improve this season? I’m looking at the offensive line. Let’s hear your takes. 🏈',created_at:new Date(Date.now()-1000*60*18).toISOString(),score:42,comments:7},
 {id:'demo-2',team_id:'OSU',author_id:'demo',author:{display_name:'SaturdaySzn',handle:'saturdayszn',favorite_cfb:'OSU',favorite_nfl:'DET'},body:'College football debate: Ohio State or Michigan — whose defense is more dangerous this year? Drop your reasoning, not just your pick.',created_at:new Date(Date.now()-1000*60*60*2).toISOString(),score:28,comments:12},
 {id:'demo-3',team_id:'JAX',author_id:'demo',author:{display_name:'DuvalDaily',handle:'duvaldaily',favorite_nfl:'JAX'},body:'Jacksonville Jaguars fans, what’s your boldest prediction for the rest of the season?',created_at:new Date(Date.now()-1000*60*60*4).toISOString(),score:17,comments:5},
 {id:'demo-4',team_id:'MIAU',author_id:'demo',author:{display_name:'TheUForever',handle:'theuforever',favorite_cfb:'MIAU',favorite_nfl:'MIA'},body:'Nothing beats a Saturday game day in Miami! What’s your best college football memory?',created_at:new Date(Date.now()-1000*60*60*7).toISOString(),score:36,comments:9},
 {id:'demo-5',team_id:'BUF',author_id:'demo',author:{display_name:'FourthAndGoal',handle:'fourthandgoal',favorite_nfl:'BUF'},body:'Who has the best fanbase in the NFL? I know my answer, but I want to hear from everyone.',created_at:new Date(Date.now()-1000*60*60*12).toISOString(),score:21,comments:15},
];
const initDemo=()=>{try{const saved=JSON.parse(localStorage.getItem(storeKey));return saved&&Array.isArray(saved.posts)?saved:null;}catch{return null;}};
function useDemo(){const [data,setData]=useState(()=>initDemo()||{posts:initialPosts,votes:{},comments:{},savedPosts:[],profile:{display_name:'Guest Fan',handle:'guestfan',favorite_nfl:'TB',favorite_cfb:'FLA',favorite_nfl_teams:['TB','JAX'],favorite_cfb_teams:['FLA','FSU'],onboarding_completed:true},friends:['gridironguru','saturdayszn'],messages:{},blitzes:[]});const update=fn=>setData(s=>{const n=fn(s);try{localStorage.setItem(storeKey,JSON.stringify(n));}catch{}return n;});return[data,update];}

function Logo({team,size=28}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[team?.logo]);if(!team)return <span className="logo-fallback" style={{width:size,height:size}}>🏈</span>;return team.isGeneral?<span className="logo-fallback" style={{width:size,height:size,backgroundColor:team.color,fontSize:Math.max(12,size*.55)}}>{team.league==='NFL'?'🏈':'🎓'}</span>:useOfficialLogos&&!failed?<img className="team-logo" src={team.logo} alt={`${team.name} logo`} style={{width:size,height:size}} loading="lazy" onError={()=>setFailed(true)}/>:<span className="logo-fallback" style={{width:size,height:size,backgroundColor:team.color}}>{team.id.slice(0,2)}</span>}
function TeamName({team,short=false,size=23,onClick,className=''}){const node=<><Logo team={team} size={size}/><span>{short&&team?.league==='NFL'?team?.name.split(' ').slice(-1)[0]:team?.name||'All teams'}</span></>;return onClick?<button type="button" className={`team-name team-clickable ${className}`} onClick={onClick}>{node}</button>:<span className={`team-name ${className}`}>{node}</span>}
// Every detected team name in post/comment text uses the same logo/name component.
function RichTeamText({text,onTeam}){const tokens=useMemo(()=>{const out=[];let current=0;let index=0;const parts=MENTIONS.map(m=>({ ...m,pattern:new RegExp('(^|[^\\p{L}\\p{N}])('+m.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=$|[^\\p{L}\\p{N}])','giu')}));while(index<text.length){let best=null;for(const m of parts){m.pattern.lastIndex=index;const match=m.pattern.exec(text);if(match){const from=match.index+match[1].length;if(!best||from<best.from||(from===best.from&&m.name.length>best.m.name.length)){best={from,to:from+match[2].length,m,matched:match[2]};}}}if(!best){out.push(text.slice(index));break;}if(best.from>index)out.push(text.slice(index,best.from));out.push({team:best.m.team,matched:best.matched,key:current++});index=best.to;}return out;},[text]);return <span className="rich-team-text">{tokens.map((part,i)=>typeof part==='string'?<React.Fragment key={i}>{part}</React.Fragment>:<button key={'t'+i} type="button" className="inline-team" onClick={()=>onTeam(part.team.id)}><Logo team={part.team} size={19}/>{part.matched}</button>)}</span>}
function TaggedPostText({text='',taggedUsers=[],onTeam,onProfile}){
 return <span>{splitTaggedText(text,taggedUsers).map((part,i)=>part.type==='mention'
  ?<button key={i} type="button" className="friend-mention-link" onClick={()=>onProfile(part.person.id)} title={'View '+(part.person.display_name||part.person.handle)}>{part.value}</button>
  :<RichTeamText key={i} text={part.value} onTeam={onTeam}/>)}</span>;
}
function FriendMentionSuggestions({text,friends,onChange}){
 const matches=friendTagOptions(text,friends);
 if(!matches.length)return null;
 return <div className="friend-tag-suggestions" role="group" aria-label="Tag a friend"><span className="friend-tag-hint">Tag a friend</span>{matches.map(friend=><button type="button" key={friend.id} className="friend-tag-choice" onClick={()=>onChange(insertFriendTag(text,friend.handle))}><Avatar person={friend} size={27}/><span><strong>{friend.display_name||friend.handle}</strong> <small>@{friend.handle}</small></span></button>)}</div>;
}
function Avatar({person,size=42,previewSrc=''}){
 const name=person?.display_name||'Fan';
 const team=getTeam(person?.avatar_team_id||person?.favorite_nfl||person?.favorite_cfb);
 const photo=previewSrc||(person?.avatar_path&&(connected?supabase.storage.from('profile-photos').getPublicUrl(person.avatar_path).data.publicUrl:person.avatar_path));
 const [imageFailed,setImageFailed]=useState(false);
 useEffect(()=>setImageFailed(false),[photo]);
 return <span className={`avatar avatar-person ${person?.avatar_type==='team'?'avatar-selected-team':''}`} style={{width:size,height:size,fontSize:Math.max(12,size*.34)}} title={name}>
 {person?.avatar_type==='photo'&&photo&&!imageFailed?<img className="avatar-photo" src={photo} alt={`${name}'s profile photo`} onError={()=>setImageFailed(true)}/>:person?.avatar_type==='team'&&team?<Logo team={team} size={Math.round(size*.85)}/>:name.slice(0,1).toUpperCase()}
 </span>;
}
function Ago({date}){const seconds=Math.max(0,(Date.now()-new Date(date).getTime())/1000);return <span>{seconds<60?'Just now':seconds<3600?`${Math.floor(seconds/60)}m ago`:seconds<86400?`${Math.floor(seconds/3600)}h ago`:`${Math.floor(seconds/86400)}d ago`}</span>}

const REACTIONS=[{id:'like',emoji:'👍',name:'Like'},{id:'love',emoji:'❤️',name:'Love'},{id:'care',emoji:'🥰',name:'Care'},{id:'haha',emoji:'😂',name:'Haha'},{id:'wow',emoji:'😮',name:'Wow'},{id:'sad',emoji:'😢',name:'Sad'},{id:'angry',emoji:'😡',name:'Angry'},{id:'fire',emoji:'🔥',name:'Fire'},{id:'dislike',emoji:'👎',name:'Dislike'}];
function ReactionPicker({reaction,count=0,onReact}){
 const [open,setOpen]=useState(false);const box=useRef(null);
 useEffect(()=>{if(!open)return;const listener=e=>{if(!box.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',listener);return()=>document.removeEventListener('pointerdown',listener)},[open]);
 const active=REACTIONS.find(x=>x.id===reaction);
 return <div className="reaction-picker" ref={box}>
   <button type="button" className={`post-action react-main ${active?'reaction-active':''}`} aria-haspopup="true" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span>{active?.emoji||'👍'}</span> {active?.name||'React'} <span className="reaction-count">{count}</span></button>
   {open&&<div className="reaction-tray" role="group" aria-label="Choose a reaction">{REACTIONS.map(x=><button type="button" title={x.name} aria-label={x.name} aria-pressed={reaction===x.id} key={x.id} onClick={()=>{onReact(x.id);setOpen(false)}}>{x.emoji}<span>{x.name}</span></button>)}</div>}
 </div>;
}
function YouTubeEmbed({text,videoId=null,compact=false}){
 const id=videoId||youtubeId(text);const [play,setPlay]=useState(false);
 useEffect(()=>setPlay(false),[id]);
 if(!id)return null;
 const watch=`https://www.youtube.com/watch?v=${id}`;
 return <div className={`youtube-card ${compact?'youtube-compact':''}`}>
  {play?<iframe title="YouTube video player" loading="lazy" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<button type="button" className="youtube-preview" onClick={()=>setPlay(true)} aria-label="Play YouTube video"><img loading="lazy" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="YouTube video thumbnail"/><span className="youtube-play">▶</span></button>}
  <div className="youtube-caption"><span>YouTube video</span><a target="_blank" rel="noopener noreferrer" href={watch}>Watch on YouTube <ExternalLink size={14}/></a></div>
 </div>;
}
function SharedPostPreview({original,onOpenOriginal,onProfile}){
 if(!original)return <div className="shared-post-preview">Original post is unavailable.</div>;
 const photos=original.media?.filter(m=>m.kind==='image')?.length?original.media.filter(m=>m.kind==='image'):(original.image_url?[{url:original.image_url}]:[]);
 return <div className="shared-post-preview"><div className="shared-author"><Avatar person={original.author} size={32}/><button type="button" className="author-link" onClick={()=>onProfile(connected?original.author_id:(original.author?.handle||original.author_id))}>{original.author?.display_name||'Football fan'}</button><span className="muted"> · Original post</span></div>
 {original.body&&<p className="post-body">{original.body}</p>}
 {photos[0]&&<button type="button" className="shared-photo" onClick={()=>onOpenOriginal(original)}><img src={photos[0].url} alt="Photo from original post" loading="lazy"/></button>}
 {(original.media||[]).find(m=>m.kind==='video')&&<video className="post-video" controls playsInline preload="metadata" src={original.media.find(m=>m.kind==='video').url}/>}
 <YouTubeEmbed text={original.body} videoId={original.youtube_video_id} compact/>
 <button type="button" className="shared-open" onClick={()=>onOpenOriginal(original)}>View original discussion <ArrowUpRight size={14}/></button>
 </div>;
}

function MenuIcon({Icon,children,active,onClick,badge}){return <button type="button" className={`nav-item ${active?'active':''}`} onClick={onClick}><Icon size={20}/><span>{children}</span>{badge&&<span className="count-dot">{badge}</span>}</button>}
function TeamPicker({value,onChange,league,placeholder='Choose a team',showAll=false,favoriteIds=[]}){
 const [open,setOpen]=useState(false);const [filter,setFilter]=useState('');
 const selected=getTeam(value);const q=filter.trim().toLowerCase();
 const matches=t=>(!league||t.league===league)&&(!q||t.name.toLowerCase().includes(q));
 const generals=TEAMS.filter(t=>t.isGeneral&&matches(t));
 const favorites=TEAMS.filter(t=>!t.isGeneral&&favoriteIds.includes(t.id)&&matches(t));
 const others=TEAMS.filter(t=>!t.isGeneral&&!favoriteIds.includes(t.id)&&matches(t));
 const choose=id=>{onChange(id);setOpen(false);setFilter('')};
 const renderOptions=(list,title)=>list.length?<React.Fragment key={title}><div className="picker-section-label">{title}</div>{list.map(t=><button type="button" key={t.id} className="picker-row" onClick={()=>choose(t.id)}><TeamName team={t} size={27}/>{value===t.id&&<Check size={15}/>}</button>)}</React.Fragment>:null;
 return <div className="team-picker"><button type="button" className="picker-trigger" aria-expanded={open} onClick={()=>setOpen(!open)}>{selected?<TeamName team={selected} size={24}/>:<span>{placeholder}</span>}<ChevronDown size={16}/></button>{open&&<div className="picker-menu"><input autoFocus aria-label="Search all football communities" placeholder="Search any NFL or college team…" value={filter} onChange={e=>setFilter(e.target.value)}/><div className="picker-scroll">{showAll&&<button type="button" className="picker-row" onClick={()=>choose('')}>🏈 All teams</button>}{renderOptions(generals,'General discussions')}{renderOptions(favorites,'My favorite teams')}{renderOptions(others,'All NFL and college teams')}{!generals.length&&!favorites.length&&!others.length&&<p className="empty">No communities found</p>}</div></div>}</div>;
}
function TeamMultiGrid({league,value,onChange,primary,onPrimary,requireOne=false}){
 const [filter,setFilter]=useState('');
 const options=TEAMS.filter(t=>!t.isGeneral&&t.league===league&&t.name.toLowerCase().includes(filter.trim().toLowerCase()));
 const selected=value||[];
 function toggle(id){if(selected.includes(id)){if(requireOne&&selected.length===1)return;const next=selected.filter(v=>v!==id);onChange(next);if(primary===id)onPrimary(next[0]||'')}else{onChange([...selected,id]);if(!primary)onPrimary(id)}}
 return <div className="multi-team-picker"><div className="team-grid-tools"><input className="text-field" placeholder={`Search ${league==='NFL'?'NFL':'college'} teams…`} value={filter} onChange={e=>setFilter(e.target.value)}/><span>{selected.length} selected</span></div><div className="team-pick-grid">{options.map(team=><div key={team.id} className={`team-pick-card ${selected.includes(team.id)?'chosen':''}`}><button type="button" className="team-pick-toggle" aria-pressed={selected.includes(team.id)} onClick={()=>toggle(team.id)}><Logo team={team} size={38}/><span>{team.name}</span><span className="pick-check">{selected.includes(team.id)?'✓':'+'}</span></button>{selected.includes(team.id)&&<button type="button" className={`primary-pick ${primary===team.id?'chosen':''}`} onClick={()=>onPrimary(team.id)}>{primary===team.id?'★ Primary':'☆ Set primary'}</button>}</div>)}</div>{options.length===0&&<p className="empty">No matching teams</p>}</div>
}
function PostDetailViewer({post,photos,video,startIndex=0,onClose,onVote,vote,comments,onReply,onTeam,saved,onToggleSave,reaction,onReact,onShare,onProfile,onEdit,taggedUsers=[]}){
 const [index,setIndex]=useState(startIndex);
 const [reply,setReply]=useState('');const [sending,setSending]=useState(false);const [replyTo,setReplyTo]=useState(null);
 const item=photos[index];const team=getTeam(post.team_id);
 useEffect(()=>{
  const key=e=>{if(e.key==='Escape')onClose();if(e.key==='ArrowRight'&&photos.length)setIndex(i=>(i+1)%photos.length);if(e.key==='ArrowLeft'&&photos.length)setIndex(i=>(i-1+photos.length)%photos.length)};
  window.addEventListener('keydown',key);const prior=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=prior};
 },[photos.length,onClose]);
 async function sendReply(e){e.preventDefault();if(!reply.trim()||sending)return;setSending(true);try{await onReply(post,reply.trim(),replyTo);setReply('');setReplyTo(null)}finally{setSending(false)}}
 return <div className="post-detail-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="post-detail-dialog" role="dialog" aria-modal="true" aria-label="Post details and comments">
   <button className="post-detail-close" type="button" aria-label="Close post" onClick={onClose}><X size={23}/></button>
   <div className="post-detail-media">
    {item?<><img key={item.id||item.url} src={item.url} alt={`Photo ${index+1} of ${photos.length} from ${post.author?.display_name||'a fan'}`}/>{photos.length>1&&<><button type="button" className="post-detail-prev" aria-label="Previous photo" onClick={()=>setIndex(i=>(i-1+photos.length)%photos.length)}><ChevronLeft/></button><button type="button" className="post-detail-next" aria-label="Next photo" onClick={()=>setIndex(i=>(i+1)%photos.length)}><ChevronRight/></button><span className="post-detail-counter">{index+1} / {photos.length}</span></>}</>:
     video?<video controls playsInline preload="metadata" src={video.url} />:<div className="post-detail-no-photo"><MessageCircle size={46}/><span>LockerNoise discussion</span></div>}
   </div>
   <section className="post-detail-info">
    <div className="post-detail-author"><Avatar person={post.author} size={44}/><div><button type="button" className="author-link" onClick={()=>onProfile(connected?post.author_id:(post.author?.handle||post.author_id))}>{post.author?.display_name||'Football fan'}</button><div className="post-detail-sub"><TeamName team={team} size={19} onClick={()=>onTeam(team?.id||'')}/> · <Ago date={post.created_at}/></div></div></div>
    {post.body&&<p className="post-detail-body"><TaggedPostText text={post.body} taggedUsers={taggedUsers} onTeam={onTeam} onProfile={onProfile}/></p>}<YouTubeEmbed text={post.body} videoId={post.youtube_video_id}/>
         <div className="post-detail-controls"><ReactionPicker reaction={reaction} count={post.reactionCount||0} onReact={kind=>onReact(post,kind)}/><button type="button" className="post-action" onClick={()=>onToggleSave(post)} aria-pressed={saved}>{saved?<BookmarkCheck size={17}/>:<Bookmark size={17}/>} {saved?'Saved':'Save'}</button><button type="button" className="post-action" onClick={()=>onShare(post)}><Repeat2 size={17}/> Share</button>{onEdit&&<button type="button" className="post-action" onClick={()=>onEdit(post)}><Pencil size={16}/> Edit</button>}<span className="post-detail-comment-count"><MessageCircle size={16}/> {comments.length} comments</span></div>
    <div className="post-detail-comments" aria-label="Discussion comments">{comments.length?comments.map((c,i)=><div className={`inline-comment ${c.parent_comment_id?"reply-item":""}`} key={c.id||i}><Avatar person={c.profiles} size={31}/><div><button type="button" className="author-link" onClick={()=>onProfile(connected?c.author_id:(c.profiles?.handle||c.author_id))}>{c.profiles?.display_name||'Fan'}</button><span className="muted"> · <Ago date={c.created_at}/></span><p><RichTeamText text={c.body} onTeam={onTeam}/></p><button type="button" className="reply-comment" onClick={()=>{setReplyTo(c.id);setReply('')}}>Reply</button></div></div>):<p className="post-detail-empty">No comments yet. Start the conversation!</p>}</div>
    <form className="post-detail-reply" onSubmit={sendReply}><input type="text" aria-label="Add a comment" value={reply} onChange={e=>setReply(e.target.value)} maxLength={1000} placeholder={replyTo?"Replying to a comment…":"Write a comment…"}/>{replyTo&&<button type="button" onClick={()=>setReplyTo(null)} aria-label="Cancel reply"><X size={13}/></button>}<button type="submit" disabled={!reply.trim()||sending}><Send size={17}/> Post</button></form>
   </section>
  </div>
 </div>;
}
function Post({post,setSelectedTeam,vote,onVote,onComment,currentUser,report,postComments=[],onInlineComment,saved=false,onToggleSave,reaction,onReact,onShare,onEdit,onProfile,originalPost,onOpenOriginal,shareCount=0,taggedUsers=[]}){
 const team=getTeam(post.team_id);
 const [expanded,setExpanded]=useState(false);
 const [showAll,setShowAll]=useState(false);
 const [reply,setReply]=useState('');
 const [sendingReply,setSendingReply]=useState(false);
  const [replyTo,setReplyTo]=useState(null);
 const [detailIndex,setDetailIndex]=useState(null);
 const media=post.media?.length?post.media:(post.image_url?[{id:'legacy',kind:'image',url:post.image_url}]:[]);
 const photos=media.filter(m=>m.kind==='image');const video=media.find(m=>m.kind==='video');
 const ownComments=postComments||[];const count=Math.max(post.comments||0,ownComments.length);
 const visible=showAll?ownComments:ownComments.slice(-2);
 async function replyNow(e){e.preventDefault();if(!reply.trim()||sendingReply)return;setSendingReply(true);try{await onInlineComment(post,reply.trim(),replyTo);setReply('');setReplyTo(null);setExpanded(true)}finally{setSendingReply(false)}}
 return <article className="post"><div className="post-top"><Avatar person={post.author}/><div className="post-meta"><div className="post-author"><button type="button" className="author-link" onClick={()=>onProfile(connected?post.author_id:(post.author?.handle||post.author_id))}>{post.author?.display_name||'Football fan'}</button> <span className="muted handle">@{post.author?.handle||'fan'}</span></div><div className="post-sub"><TeamName team={team} size={19} onClick={()=>setSelectedTeam(team.id)}/><span className="separator">·</span><Ago date={post.created_at}/></div></div><button className="post-more" title="Report this post" onClick={()=>report(post)}><ShieldAlert size={18}/></button></div>
 {post.shared_post_id&&<div className="share-indicator"><Repeat2 size={14}/> Shared a post</div>}
  {post.body&&<p className="post-body"><TaggedPostText text={post.body} taggedUsers={taggedUsers} onTeam={setSelectedTeam} onProfile={onProfile}/></p>}
  {post.edited_at&&<span className="post-edited"><Clock3 size={12}/> Edited · <Ago date={post.edited_at}/></span>}
  {post.shared_post_id&&<SharedPostPreview original={originalPost} onOpenOriginal={onOpenOriginal} onProfile={onProfile}/>}
  <YouTubeEmbed text={post.body} videoId={post.youtube_video_id}/>
  
 {photos.length>0&&<div className={`post-gallery gallery-count-${photos.length}`}>{photos.map((m,i)=><button type="button" key={m.id||i} className="post-gallery-photo" onClick={()=>setDetailIndex(i)} aria-label={`Open photo ${i+1} of ${photos.length}`}><img src={m.url} loading="lazy" alt={`Post photo ${i+1}`}/></button>)}</div>}
 {video&&<video className="post-video" controls preload="metadata" playsInline src={video.url} aria-label="Football community video"/>}
   <div className="post-footer"><ReactionPicker reaction={reaction} count={post.reactionCount||0} onReact={kind=>onReact(post,kind)}/><button className="post-action" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><MessageCircle size={18}/> {count} {count===1?'comment':'comments'}</button><button className="post-action" type="button" onClick={()=>onToggleSave(post)} aria-pressed={saved}>{saved?<BookmarkCheck size={18}/>:<Bookmark size={18}/>} {saved?'Saved':'Save'}</button><button className="post-action" type="button" onClick={()=>setDetailIndex(0)}><ArrowUpRight size={18}/> Open</button><button className="post-action share" onClick={()=>onShare(post)}><Repeat2 size={18}/> Share {shareCount>0?`(${shareCount})`:null}</button>{onEdit&&<button className="post-action" onClick={()=>onEdit(post)}><Pencil size={16}/> Edit</button>}</div>
 {(ownComments.length>0||expanded)&&<div className="inline-comments" aria-label="Post comments">{visible.map((c,i)=><div className={`inline-comment ${c.parent_comment_id?"reply-item":""}`} key={c.id||i}><Avatar person={c.profiles} size={28}/><div><button type="button" className="author-link" onClick={()=>onProfile(connected?c.author_id:(c.profiles?.handle||c.author_id))}>{c.profiles?.display_name||'Fan'}</button><span className="muted"> · <Ago date={c.created_at}/></span><p><RichTeamText text={c.body} onTeam={setSelectedTeam}/></p><button type="button" className="reply-comment" onClick={()=>{setReplyTo(c.id);setExpanded(true)}}>Reply</button></div></div>)}{ownComments.length>2&&!showAll&&<button className="inline-more" onClick={()=>setShowAll(true)}>View all {ownComments.length} comments</button>}{expanded&&<form className="inline-comment-form" onSubmit={replyNow}><input maxLength={1000} required value={reply} onChange={e=>setReply(e.target.value)} placeholder={replyTo?"Reply to this comment…":"Write a comment…"} aria-label="Write a comment"/>{replyTo&&<button type="button" onClick={()=>setReplyTo(null)}>Cancel</button>}<button disabled={sendingReply||!reply.trim()} type="submit"><Send size={16}/> Reply</button></form>}</div>}
 {detailIndex!==null&&<PostDetailViewer post={post} photos={photos} video={video} taggedUsers={taggedUsers} startIndex={detailIndex} onClose={()=>setDetailIndex(null)} onVote={onVote} vote={vote} comments={ownComments} onReply={onInlineComment} onTeam={setSelectedTeam} saved={saved} onToggleSave={onToggleSave} reaction={reaction} onReact={onReact} onShare={p=>{setDetailIndex(null);onShare(p)}} onProfile={id=>{setDetailIndex(null);onProfile(id)}} onEdit={onEdit?p=>{setDetailIndex(null);onEdit(p)}:null}/>}
 </article>
}
function hashString(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function NewsCard({article,onTeam}){return <article className="news-card"><div className="news-icon"><Newspaper size={22}/></div><div className="news-main"><div className="news-kicker"><span className="news-label">SPORTS NEWS</span> <span>{article.league==='NFL'?'NFL':'College football'}</span><span>·</span><span>{article.source}</span>{article.published_at&&<><span>·</span><Ago date={article.published_at}/></>}</div><div className="news-headline"><RichTeamText text={article.title} onTeam={onTeam}/></div><a className="news-caption news-read-link" href={article.url} target="_blank" rel="noopener noreferrer">Read original article at {article.source} <ArrowUpRight size={14}/></a></div></article>}
function PeopleCard({person,relationship,onClick,onMessage,onBlitz,onProfile}){return <div className="person-row"><Avatar person={person} size={44}/><div className="person-info"><button type="button" className="author-link" onClick={()=>onProfile(person.id)}>{person.display_name}</button><span>@{person.handle}</span><div className="person-teams">{person.favorite_nfl&&getTeam(person.favorite_nfl)&&<TeamName team={getTeam(person.favorite_nfl)} size={16}/>} {person.favorite_cfb&&getTeam(person.favorite_cfb)&&<TeamName team={getTeam(person.favorite_cfb)} size={16}/>}</div></div><button className={`friend-btn ${relationship==='accepted'?'is-friend':''}`} onClick={()=>onClick(person,relationship)}><UserPlus size={16}/>{relationship==='accepted'?'Unfriend':relationship==='outgoing'?'Cancel request':relationship==='incoming'?'Accept request':'Add friend'}</button>{relationship==='accepted'&&<div className="friend-actions"><button className="blitz-button" onClick={()=>onBlitz(person)} title="Send your friend a Blitz"><Zap size={14}/> Blitz</button><button className="friend-btn" onClick={()=>onMessage(person)}><MessageCircle size={14}/> Chat</button></div>}</div>}
function Modal({children,onClose,title}){useEffect(()=>{const listener=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[onClose]);return <div className="modal-layer" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={22}/></button></div>{children}</div></div>}

function MessageCenter({friends,userId,connected,demoMessages,onDemoSend,initialFriendId,note,onReadConversation,unreadByFriend}){
 const [activeId,setActiveId]=useState(initialFriendId||'');
 const [text,setText]=useState('');
 const [serverMessages,setServerMessages]=useState([]);
 const [sending,setSending]=useState(false);
 useEffect(()=>{if(initialFriendId)setActiveId(initialFriendId)},[initialFriendId]);
 useEffect(()=>{if(!activeId&&friends.length)setActiveId(friends[0].id)},[activeId,friends]);
 const active=friends.find(p=>p.id===activeId);
 const fetchMessages=async()=>{if(!connected||!userId||!active)return;const {data,error}=await supabase.from('direct_messages')
  .select('id,sender_id,recipient_id,body,created_at').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
  .order('created_at',{ascending:false}).limit(250);
  if(error){note(error.message);return}setServerMessages((data||[]).filter(m=>m.sender_id===active.id||m.recipient_id===active.id).reverse());};
 useEffect(()=>{if(!connected||!activeId)return;
 let live=true;
 const load=async()=>{await fetchMessages();if(live&&onReadConversation)await onReadConversation(activeId)};
 load();const poll=setInterval(load,15000);
 return()=>{live=false;clearInterval(poll)};
 },[connected,userId,activeId]);
 const shown=connected?serverMessages:(demoMessages?.[activeId]||[]);
 const send=async(e)=>{e.preventDefault();const body=text.trim();if(!body||!active||sending)return;setSending(true);
  try{if(connected){const {error}=await supabase.from('direct_messages').insert({sender_id:userId,recipient_id:active.id,body});if(error)throw error;await fetchMessages();}
  else onDemoSend(active.id,body);setText('');}catch(err){note(err.message||'Could not send message')}finally{setSending(false)}};
 return <div className="messages-layout"><div className="message-friends"><h3>Friends</h3>{friends.length?friends.map(p=><button key={p.id} className={p.id===activeId?'selected':''} onClick={()=>setActiveId(p.id)}><Avatar person={p} size={29}/><span className="message-friend-label">{p.display_name}</span>{unreadByFriend?.[p.id]>0&&<span className="message-unread-badge" aria-label={`${unreadByFriend[p.id]} unread messages`}>{unreadByFriend[p.id]>99?'99+':unreadByFriend[p.id]}</span>}</button>):<p className="message-muted">Add a friend to start a conversation.</p>}</div>
 <div className="message-box">{active?<><h3><MessageCircle size={17} style={{verticalAlign:'middle'}}/> Chat with {active.display_name}</h3><div className="message-history" role="log" aria-label="Direct messages">{shown.length?shown.map((m,i)=><div className={`message-bubble ${connected?(m.sender_id===userId?'mine':''):(m.mine?'mine':'')}`} key={m.id||i}>{m.body}</div>):<p className="message-muted">Your conversation starts here. Messages are visible only to the two participants when connected to the secure database.</p>}</div><form className="message-entry" onSubmit={send}><input maxLength={2000} value={text} onChange={e=>setText(e.target.value)} aria-label="Write a message" placeholder="Write a private message…"/><button disabled={!text.trim()||sending} type="submit"><Send size={16}/></button></form></>:<p className="message-muted">Choose a friend to chat.</p>}</div></div>
}


function NotificationCenter({open,onClose,incoming,activity,unreadKeys,totalUnread,onAccept,onDecline,onChat,onBlitzBack,onPost,onProfile,onMarkAll,processing}){
 const entries=[
  ...incoming.map(entry=>({id:`request:${entry.request.id}`,kind:'request',created_at:entry.request.created_at||new Date().toISOString(),...entry})),
  ...activity.filter(item=>item.read_at===null).map(item=>({id:`${item.kind}:${item.id}`,kind:item.kind,created_at:item.created_at,person:item.person,item}))
 ].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 return <div className="notify-wrap">
  <button type="button" className="notification-bell" aria-label={`Notifications${totalUnread?`, ${totalUnread} new`:''}`} aria-haspopup="dialog" aria-expanded={open} onClick={onClose.toggle}><Bell size={21}/>{totalUnread>0&&<span className="notification-count">{totalUnread>99?'99+':totalUnread}</span>}</button>
  {open&&<div className="notification-panel" role="dialog" aria-label="Notifications">
   <div className="notification-header"><div><strong>Notifications</strong><small>Tags, comments, replies, requests, messages &amp; Blitzes</small></div><button type="button" className="notification-close" onClick={onClose.close} aria-label="Close notifications"><X size={18}/></button></div>
   <div className="notification-toolbar"><span>{totalUnread} unread</span><button type="button" onClick={onMarkAll} disabled={!totalUnread || (unreadKeys.length===incoming.length && !activity.length)}>Mark all read</button></div>
   <div className="notification-scroll">
   {!entries.length&&<div className="notification-empty"><Bell size={29}/><b>You're all caught up!</b><p>New tags, comments and replies will show up here when fans interact with your posts.</p></div>}
   {entries.map(entry=><div key={entry.id} className={`notification-entry ${unreadKeys.includes(entry.id)?'unread':''}`}>
    <Avatar person={entry.person} size={37}/>
    <div className="notification-body"><p>
     <button type="button" className="author-link" onClick={()=>onProfile(entry.person?.id)}>{entry.person?.display_name||'A fan'}</button>{' '}
     {entry.kind==='request'?'sent you a friend request.':entry.kind==='message'?'sent you a message.':entry.kind==='comment'?'commented on your post.':entry.kind==='reply'?'replied to your comment.':entry.kind==='mention'?'tagged you in a post.':'Blitzed you! ⚡'}
    </p>
    {(entry.kind==='comment'||entry.kind==='reply'||entry.kind==='mention')&&entry.item?.preview&&<p className="notification-preview">“{entry.item.preview}”</p>}
    <small><Ago date={entry.created_at}/></small>
    <div className="notification-actions">
     {entry.kind==='request'?<><button className="notification-primary" disabled={processing===entry.id} onClick={()=>onAccept(entry)}><Check size={15}/> Accept</button><button disabled={processing===entry.id} onClick={()=>onDecline(entry)}>Decline</button></>:
     entry.kind==='message'?<button type="button" className="notification-primary" onClick={()=>onChat(entry)}>Open chat</button>:
     entry.kind==='comment'||entry.kind==='reply'||entry.kind==='mention'?<button type="button" className="notification-primary" onClick={()=>onPost(entry)}><MessageCircle size={15}/> View discussion</button>:
     <button type="button" className="notification-primary" onClick={()=>onBlitzBack(entry)}><Zap size={15}/> Blitz back</button>}
    </div>
    </div>
   </div>)}
   </div>
  </div>}
 </div>;
}

function ThemeChoices({value,onChange}){
 return <div className="theme-choices" role="group" aria-label="Choose LockerNoise appearance">{THEMES.map(option=><button key={option.id} type="button" className={`theme-choice ${value===option.id?'active':''}`} aria-pressed={value===option.id} onClick={()=>onChange(option.id)}><span className="theme-swatch" style={{background:option.preview[0]}}><i style={{background:option.preview[1]}}/><i style={{background:option.preview[2]}}/></span><span>{option.name}</span>{value===option.id&&<Check size={15} aria-hidden="true"/>}</button>)}</div>
}

export default function App(){
 const [splashFinished,setSplashFinished]=useState(false);
 const [introSoundEnabled,setIntroSoundEnabled]=useState(()=>{try{return localStorage.getItem('lockernoise-intro-sound')!=='off'}catch{return true}});
 const introAudioRef=useRef(null);
 useEffect(()=>{try{localStorage.setItem('lockernoise-intro-sound',introSoundEnabled?'on':'off')}catch{}},[introSoundEnabled]);
 useEffect(()=>{
  if(!introSoundEnabled||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const audio=new Audio('/audio/lockernoise-intro.mp3');
  audio.preload='auto';audio.volume=0.45;introAudioRef.current=audio;
  const startedAt=Date.now();
  const tryPlay=()=>{if(audio.paused && Date.now()-startedAt<2700)audio.play().catch(()=>{});};
  tryPlay(); // Automatically attempt audio. Mobile browser policies may block unprompted sound.
  // A real interaction during the splash gives mobile browsers a second permitted chance.
  const firstInteraction=()=>tryPlay();
  document.addEventListener('pointerdown',firstInteraction,{once:true});
  document.addEventListener('keydown',firstInteraction,{once:true});
  return()=>{document.removeEventListener('pointerdown',firstInteraction);document.removeEventListener('keydown',firstInteraction);audio.pause();audio.src='';introAudioRef.current=null};
 },[]);

 // Play launch once per page/app startup, without exposing sign-in before authentication resolves.
 useEffect(()=>{
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const timer=window.setTimeout(()=>setSplashFinished(true),reduced?350:2700);
  return()=>window.clearTimeout(timer);
 },[]);
 const [theme,setTheme]=useState(savedTheme);
 const [demo,updateDemo]=useDemo();const [session,setSession]=useState(null);const [profile,setProfile]=useState(null);const [posts,setPosts]=useState([]);const [comments,setComments]=useState([]);const [votes,setVotes]=useState([]);const [reactions,setReactions]=useState([]);
 const [selectedTeam,setSelectedTeam]=useState(()=>new URLSearchParams(location.search).get('team')||'');const [league,setLeague]=useState('ALL');const [sort,setSort]=useState(savedFeedSort);const [view,setView]=useState('home');const [search,setSearch]=useState('');const [modal,setModal]=useState('');const [modalPost,setModalPost]=useState(null);const [newPost,setNewPost]=useState('');const [postMentions,setPostMentions]=useState({});const [attachedYoutubeId,setAttachedYoutubeId]=useState(null);const [newTeam,setNewTeam]=useState('TB');const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState('');const [authMode,setAuthMode]=useState('signup');const [authName,setAuthName]=useState('');const [authEmail,setAuthEmail]=useState('');const [authPassword,setAuthPassword]=useState('');const [draftNFL,setDraftNFL]=useState('TB');const [draftCFB,setDraftCFB]=useState('FLA');const [draftNFLTeams,setDraftNFLTeams]=useState(['TB']);const [draftCFBTeams,setDraftCFBTeams]=useState(['FLA']);const [onboardStep,setOnboardStep]=useState(1);const [authReady,setAuthReady]=useState(!connected);const [draftName,setDraftName]=useState('');const [commentText,setCommentText]=useState('');const [sidebarOpen,setSidebarOpen]=useState(false);const [friendships,setFriendships]=useState([]);const [people,setPeople]=useState([]);const [news,setNews]=useState([]);const [newsStatus,setNewsStatus]=useState('loading');const [mixSeed,setMixSeed]=useState(0);const [messageTarget,setMessageTarget]=useState('');const [draftPrivacy,setDraftPrivacy]=useState('public');const [draftAllowBlitz,setDraftAllowBlitz]=useState(true);const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [incomingActivity,setIncomingActivity]=useState({messages:[],blitzes:[],comments:[]});
  const [memberProfile,setMemberProfile]=useState(null);const [memberPosts,setMemberPosts]=useState([]);const [memberMore,setMemberMore]=useState(false);const [memberBusy,setMemberBusy]=useState(false);
  const [commentReplyTo,setCommentReplyTo]=useState(null);const [shareTarget,setShareTarget]=useState(null);const [shareText,setShareText]=useState('');const [editTarget,setEditTarget]=useState(null);const [editText,setEditText]=useState('');const [editYoutubeId,setEditYoutubeId]=useState(null);
  const [postProgress,setPostProgress]=useState('');const submittingPostRef=useRef(false);const submissionIdRef=useRef(null);
 const [seenActivity,setSeenActivity]=useState([]);
 const [notificationProcessing,setNotificationProcessing]=useState('');
 const [unreadMessages,setUnreadMessages]=useState(0);
 const [unreadByFriend,setUnreadByFriend]=useState({});const [newsLimit,setNewsLimit]=useState(12);const [draftBio,setDraftBio]=useState('');const [newPhotos,setNewPhotos]=useState([]);const [newVideo,setNewVideo]=useState(null);const [videoPreview,setVideoPreview]=useState('');const [mediaSetupError,setMediaSetupError]=useState('');const [sharedSources,setSharedSources]=useState([]);const [shareCounts,setShareCounts]=useState({});const [savedPostIds,setSavedPostIds]=useState([]);const [savedPostsExtra,setSavedPostsExtra]=useState([]);
 const [draftAvatarType,setDraftAvatarType]=useState('team');
 const [draftAvatarTeam,setDraftAvatarTeam]=useState('');
 const [draftAvatarFile,setDraftAvatarFile]=useState(null);
 const [draftAvatarPreview,setDraftAvatarPreview]=useState('');
 useEffect(()=>()=>{if(draftAvatarPreview?.startsWith('blob:'))URL.revokeObjectURL(draftAvatarPreview)},[draftAvatarPreview]);
 useEffect(()=>()=>{newPhotos.forEach(m=>{if(m.url.startsWith('blob:'))URL.revokeObjectURL(m.url)})},[newPhotos]);
 useEffect(()=>()=>{if(videoPreview.startsWith('blob:'))URL.revokeObjectURL(videoPreview)},[videoPreview]);
 useEffect(()=>{if(!sidebarOpen)return;const closeOnEscape=e=>{if(e.key==='Escape')setSidebarOpen(false)};document.addEventListener('keydown',closeOnEscape);return()=>document.removeEventListener('keydown',closeOnEscape)},[sidebarOpen]);
 useEffect(()=>setSidebarOpen(false),[view]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem(THEME_STORAGE_KEY,theme)}catch{}},[theme]);
 // Server profile preference wins after login; the local preference powers offline/demo mode.
 useEffect(()=>{if(connected && profile?.id && validTheme(profile.theme))setTheme(profile.theme)},[profile?.id]);
 async function chooseTheme(next){
  if(!validTheme(next)||next===theme)return;
  setTheme(next);
  if(connected && session?.user?.id){
   const {error}=await supabase.from('profiles').update({theme:next}).eq('id',session.user.id);
   if(error)note('Theme set on this device, but account sync failed: '+error.message);
   else setProfile(p=>p?{...p,theme:next}:p);
  }
 }
  async function chooseSort(next){
   if(!validFeedSort(next))return;
   setSort(next);
   try{localStorage.setItem(FEED_SORT_KEY,next)}catch{}
   if(connected&&session?.user?.id){
    const {error}=await supabase.from('profiles').update({feed_sort:next}).eq('id',session.user.id);
    if(error)note('Feed preference saved on this device, but account sync failed: '+error.message);
    else setProfile(old=>old?{...old,feed_sort:next}:old);
   }
  }
 const effectiveProfile=connected?profile:demo.profile;
 const isMember=connected?Boolean(session?.user):true;
 const selected=getTeam(selectedTeam);
 const loadedPosts=connected?posts:demo.posts;
 const liked=post=>connected?votes.find(v=>v.post_id===post.id&&v.user_id===session?.user?.id)?.value||0:demo.votes[post.id]||0;
  const selectedReaction=post=>connected?reactions.find(r=>r.post_id===post.id&&r.user_id===session?.user?.id)?.reaction||null:(demo.reactions||{})[post.id]||null;
 function note(v){setFeedback(v);setTimeout(()=>setFeedback(''),4500)}
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session)).catch(()=>setSession(null)).finally(()=>setAuthReady(true));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(!supabase)return;(async()=>{if(session?.user){const {data,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle();if(error)note(error.message);if(data){setProfile(data);if(validFeedSort(data.feed_sort)){setSort(data.feed_sort);try{localStorage.setItem(FEED_SORT_KEY,data.feed_sort)}catch{}}setDraftNFLTeams(data.favorite_nfl_teams?.length?data.favorite_nfl_teams:(data.favorite_nfl?[data.favorite_nfl]:[]));setDraftCFBTeams(data.favorite_cfb_teams?.length?data.favorite_cfb_teams:(data.favorite_cfb?[data.favorite_cfb]:[]));setDraftNFL(data.favorite_nfl||'');setDraftCFB(data.favorite_cfb||'')}else{const defaultName=session.user.user_metadata?.display_name||'New Fan';const uniqueHandle='fan'+session.user.id.replaceAll('-','').slice(0,12);const {data:created,error:err}=await supabase.from('profiles').upsert({id:session.user.id,handle:uniqueHandle,display_name:defaultName,theme}).select().single();if(err)note(err.message);else setProfile(created);}}else setProfile(null)})();},[session?.user?.id]);
 async function refreshPeople(){if(!supabase||!session?.user)return;const uid=session.user.id;const [f,p]=await Promise.all([supabase.from('friendships').select('id,requester_id,addressee_id,status').or(`requester_id.eq.${uid},addressee_id.eq.${uid}`).limit(300),supabase.from('profiles').select('id,display_name,handle,bio,profile_visibility,favorite_nfl,favorite_cfb,favorite_nfl_teams,favorite_cfb_teams,avatar_type,avatar_team_id,avatar_path').order('created_at',{ascending:false}).limit(150)]);if(f.error)note(f.error.message);else setFriendships(f.data||[]);if(p.error)note(p.error.message);else setPeople((p.data||[]).filter(x=>x.id!==uid));}
 useEffect(()=>{if(session?.user?.id)refreshPeople();else {setFriendships([]);setPeople([]);setIncomingActivity({messages:[],blitzes:[],comments:[]});setUnreadMessages(0);setUnreadByFriend({});setNotificationsOpen(false)}},[session?.user?.id]);
 const activityStorageKey=`lockernoise-notification-seen:${session?.user?.id||'guest'}`;
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(activityStorageKey)||'[]');setSeenActivity(Array.isArray(stored)?stored:[])}catch{setSeenActivity([])}},[activityStorageKey]);
 async function refreshActivity(){
  if(!supabase||!session?.user?.id)return;
  const uid=session.user.id;
  const [messages,blitzes,unread,activityComments]=await Promise.all([
   supabase.from('direct_messages').select('id,sender_id,created_at,read_at').eq('recipient_id',uid).order('created_at',{ascending:false}).limit(30),
   supabase.from('blitzes').select('id,sender_id,created_at,read_at').eq('recipient_id',uid).order('created_at',{ascending:false}).limit(30),
   supabase.from('direct_messages').select('id,sender_id',{count:'exact'}).eq('recipient_id',uid).is('read_at',null).limit(500),
    supabase.from('activity_notifications').select('id,actor_id,kind,post_id,comment_id,preview,created_at,read_at').eq('recipient_id',uid).order('created_at',{ascending:false}).limit(50)
  ]);
  if(!unread.error){
   setUnreadMessages(unread.count||0);
   const perFriend={};for(const msg of unread.data||[])perFriend[msg.sender_id]=(perFriend[msg.sender_id]||0)+1;
   setUnreadByFriend(perFriend);
  } else note('Unread messages could not be loaded: '+unread.error.message);
  // RLS restricts each query to the signed-in recipient; no service key needed.
  setIncomingActivity({messages:messages.error?[]:(messages.data||[]),blitzes:blitzes.error?[]:(blitzes.data||[]),comments:activityComments.error?[]:(activityComments.data||[])});
   if(activityComments.error)note('Comment notifications unavailable: '+activityComments.error.message);
 }
 useEffect(()=>{
  if(!session?.user?.id)return;
  refreshActivity();
  // Polling is a reliable starter before enabling a server Realtime publication.
  const check=()=>{if(document.visibilityState==='visible'){refreshPeople();refreshActivity()}};
  const timer=setInterval(check,20000);
  window.addEventListener('focus',check);
  return()=>{clearInterval(timer);window.removeEventListener('focus',check)};
 },[session?.user?.id]);
 function markActivityRead(ids){
  if(!ids.length)return;
  setSeenActivity(prev=>{const next=[...new Set([...prev,...ids])].slice(-500);
   try{localStorage.setItem(activityStorageKey,JSON.stringify(next))}catch{}
   return next});
 }

 useEffect(()=>{let active=true;const load=async()=>{try{const res=await fetch('/.netlify/functions/news',{cache:'no-store'});if(!res.ok)throw new Error('News feed unavailable');const data=await res.json();if(active){setNews(Array.isArray(data.items)?data.items:[]);setNewsStatus(data.items?.length?'ready':'empty');setMixSeed(n=>n+1)}}catch{if(active)setNewsStatus('unavailable')}};load();const id=setInterval(load,10*60*1000);return()=>{active=false;clearInterval(id)}},[]);
 const friendHandles=connected?new Set(friendships.filter(f=>f.status==='accepted').map(f=>f.requester_id===session?.user?.id?f.addressee_id:f.requester_id)):new Set(demo.friends||[]);
 const isFriendPost=p=>isAcceptedFriendsPost(p,connected,session?.user?.id,friendHandles,demo.profile?.handle,demo.friends||[]);
 const isNetworkPostItem=p=>isNetworkPost(p,connected,session?.user?.id,friendHandles,demo.profile?.handle,demo.friends||[]);
 const directory=connected?people:[...new Map(initialPosts.map(x=>[x.author.handle,{...x.author,id:x.author.handle}])).values()];
 const personForId=id=>directory.find(p=>p.id===id)||{id,display_name:'A football fan',handle:'member'};
 const acceptedFriends=directory.filter(p=>relationshipFor(p)==='accepted');
 const pendingFriendRequests=connected?friendships.filter(f=>f.status==='pending'&&f.addressee_id===session?.user?.id).map(request=>({request,person:personForId(request.requester_id)})):[];
 const receivedActivity=[...incomingActivity.messages.map(item=>({...item,kind:'message',person:personForId(item.sender_id)})),...incomingActivity.blitzes.map(item=>({...item,kind:'blitz',person:personForId(item.sender_id)})),...incomingActivity.comments.map(item=>({...item,person:personForId(item.actor_id)}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,40);
 const unreadKeys=[...pendingFriendRequests.map(({request})=>`request:${request.id}`),...receivedActivity.filter(item=>item.read_at===null&&!seenActivity.includes(`${item.kind}:${item.id}`)).map(item=>`${item.kind}:${item.id}`)];
 const unreadBlitzCount=receivedActivity.filter(item=>item.kind==='blitz'&&item.read_at===null&&!seenActivity.includes(`blitz:${item.id}`)).length;
 const unreadCommentCount=incomingActivity.comments.filter(item=>item.read_at===null).length;
  const totalUnread=pendingFriendRequests.length+unreadMessages+unreadBlitzCount+unreadCommentCount;
 async function markConversationRead(friendId){
  if(!supabase||!session?.user?.id||!friendId)return;
  const {error}=await supabase.from('direct_messages').update({read_at:new Date().toISOString()})
   .eq('recipient_id',session.user.id).eq('sender_id',friendId).is('read_at',null);
  if(error){note('Could not mark messages read: '+error.message);return}
  await refreshActivity();
 }
 async function markAllNotificationsRead(){
  markActivityRead(receivedActivity.filter(item=>item.kind==='blitz').map(item=>`blitz:${item.id}`));
  if(supabase&&session?.user?.id){const {error:commentError}=await supabase.from('activity_notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',session.user.id).is('read_at',null);if(commentError)note('Could not clear comment alerts: '+commentError.message);const {error:blitzError}=await supabase.from('blitzes').update({read_at:new Date().toISOString()}).eq('recipient_id',session.user.id).is('read_at',null);if(blitzError)note('Unable to mark Blitzes read: '+blitzError.message);}
  if(connected&&session?.user?.id){
   const {error}=await supabase.from('direct_messages').update({read_at:new Date().toISOString()})
    .eq('recipient_id',session.user.id).is('read_at',null);
   if(error)note(error.message);else await refreshActivity();
  }
 }

 function relationshipFor(p){if(!connected)return (demo.friends||[]).includes(p.handle)?'accepted':'none';const f=friendships.find(x=>x.requester_id===p.id||x.addressee_id===p.id);if(!f)return'none';if(f.status==='accepted')return'accepted';return f.requester_id===session?.user?.id?'outgoing':'incoming'}
 async function toggleFriend(p,relationship){if(relationship==='accepted'&&!window.confirm(`Remove ${p.display_name} from your friends?`))return;if(!isMember){setModal('auth');return}if(!connected){updateDemo(s=>({...s,friends:relationship==='accepted'?(s.friends||[]).filter(x=>x!==p.handle):[...(s.friends||[]),p.handle]}));note(relationship==='accepted'?'Removed from your demo friends':'Added to your demo friends');return}const existing=friendships.find(x=>x.requester_id===p.id||x.addressee_id===p.id);let r;if(relationship==='accepted'||relationship==='outgoing')r=await supabase.from('friendships').delete().eq('id',existing.id);else if(relationship==='incoming')r=await supabase.from('friendships').update({status:'accepted'}).eq('id',existing.id);else r=await supabase.from('friendships').insert({requester_id:session.user.id,addressee_id:p.id});if(r.error)note(r.error.message);else {await refreshPeople();note(relationship==='incoming'?'Friend request accepted':relationship==='none'?'Friend request sent':'Friend list updated')}}
 async function declineFriend(entry){
  if(!connected||!session?.user?.id)return;
  setNotificationProcessing(entry.id);
  try{const {error}=await supabase.from('friendships').delete().eq('id',entry.request.id).eq('addressee_id',session.user.id);
   if(error)throw error;await refreshPeople();note('Friend request declined')}
  catch(err){note(err.message||'Could not decline request')}
  finally{setNotificationProcessing('')}
 }
 async function acceptNotification(entry){
  setNotificationProcessing(entry.id);
  try{await toggleFriend(entry.person,'incoming')}
  finally{setNotificationProcessing('')}
 }
   async function loadMemberPosts(userId,offset=0){
   if(!userId)return;
   if(!connected){setMemberPosts(demo.posts.filter(post=>post.author?.handle===userId));setMemberMore(false);return;}
   setMemberBusy(true);
   try{
    const {data,error}=await supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,favorite_cfb,avatar_type,avatar_team_id,avatar_path)').eq('author_id',userId).order('created_at',{ascending:false}).range(offset,offset+19);
    if(error)throw error;
    const ids=(data||[]).map(p=>p.id);let media=[],postReactions=[];
    if(ids.length){const [m,r]=await Promise.all([supabase.from('post_media').select('id,post_id,kind,storage_path,position').in('post_id',ids),supabase.from('post_reactions').select('post_id,user_id,reaction').in('post_id',ids)]);if(m.error)throw m.error;if(r.error)throw r.error;media=m.data||[];postReactions=r.data||[];}
    const items=(data||[]).map(post=>({...post,author:post.profiles,media:media.filter(m=>m.post_id===post.id).map(m=>({...m,url:supabase.storage.from(m.kind==='video'?'post-videos':'post-images').getPublicUrl(m.storage_path).data.publicUrl})),image_url:post.image_path?supabase.storage.from('post-images').getPublicUrl(post.image_path).data.publicUrl:null,reactionCount:postReactions.filter(r=>r.post_id===post.id).length}));
    setMemberPosts(prev=>offset?[...prev,...items]:items);setMemberMore(items.length===20);if(ids.length)await refreshPostTags(ids);
   }catch(e){note('Could not load member posts: '+e.message)}finally{setMemberBusy(false)}
  }
  async function openMemberProfile(userId){
   if(!userId)return;
   if(userId===session?.user?.id || (!connected && userId===demo.profile?.handle)){switchTeam('');setView('profile');return;}
   let member=directory.find(p=>p.id===userId) || loadedPosts.find(p=>p.author_id===userId)?.author;
   if(connected){const {data,error}=await supabase.from('profiles').select('id,display_name,handle,bio,profile_visibility,favorite_nfl,favorite_cfb,favorite_nfl_teams,favorite_cfb_teams,avatar_type,avatar_team_id,avatar_path').eq('id',userId).maybeSingle();if(error)return note(error.message);if(data)member=data;}
   if(!member)return note('Member profile is not available.');
   setMemberProfile({...member,id:userId});setMemberPosts([]);switchTeam('');setView('member');loadMemberPosts(userId,0);
  }
  async function openPostModal(post){if(!post)return;
   let complete=post;
   if(connected&&!post.media?.length){const {data}=await supabase.from('post_media').select('id,post_id,kind,storage_path,position').eq('post_id',post.id).order('position',{ascending:true});if(data?.length)complete={...post,media:data.map(m=>({...m,url:supabase.storage.from(m.kind==='video'?'post-videos':'post-images').getPublicUrl(m.storage_path).data.publicUrl}))};}
   if(connected)refreshPostTags([complete.id]);setModalPost(complete);setCommentText('');setCommentReplyTo(null);setModal('viewpost');
  }
  function openShare(post){if(!isMember){setModal('auth');return;}if(connected&&post.author?.profile_visibility==='private'&&post.author_id!==session?.user?.id)return note('Posts from private profiles cannot be reshared.');setShareTarget(post);setShareText('');setModal('share');}
  function changeComposeText(value){
   const found=extractYouTubeAttachment(value);
   if(found.videoId){setAttachedYoutubeId(found.videoId);setNewPost(found.caption)}
   else setNewPost(value);
  }
  function changeEditText(value){
   const found=extractYouTubeAttachment(value);
   if(found.videoId){setEditYoutubeId(found.videoId);setEditText(found.caption)}
   else setEditText(value);
  }
  function openEdit(post){if(post.author_id!==session?.user?.id&&connected)return note('You can only edit your own posts.');if(!connected&&post.author?.handle!==demo.profile?.handle)return note('You can only edit your own posts.');const extracted=extractYouTubeAttachment(post.body||'');setEditTarget(post);setEditYoutubeId(post.youtube_video_id||extracted.videoId);setEditText(extracted.videoId?extracted.caption:(post.body||''));setModal('edit');}
  async function saveEdit(){if(!editTarget||busy)return;const body=editText.trim();if(!body&&!editYoutubeId&&!editTarget.media?.length&&!editTarget.image_url&&!editTarget.shared_post_id)return note('A post needs some text, a video, or other media.');setBusy(true);try{if(connected){const {data,error}=await supabase.from('posts').update({body,youtube_video_id:editYoutubeId}).eq('id',editTarget.id).eq('author_id',session.user.id).select('id').single();if(error)throw error;if(!data)throw new Error('Post was not updated');await synchronizeFriendTags(data.id,body);await refresh();}else updateDemo(d=>({...d,posts:d.posts.map(p=>p.id===editTarget.id?{...p,body,youtube_video_id:editYoutubeId,edited_at:new Date().toISOString()}:p)}));setModal('');note('Post updated.');}catch(e){note('Edit failed: '+e.message)}finally{setBusy(false)}}
  async function synchronizeFriendTags(postId,body){
   if(!supabase||!session?.user?.id)return;
   const desired=mentionsInPost(body,acceptedFriends).map(p=>p.id);
   const {data:old,error:readError}=await supabase.from('post_mentions').select('mentioned_user_id').eq('post_id',postId);
   if(readError)throw readError;
   const previous=(old||[]).map(r=>r.mentioned_user_id),remove=previous.filter(id=>!desired.includes(id)),add=desired.filter(id=>!previous.includes(id));
   if(remove.length){const {error}=await supabase.from('post_mentions').delete().eq('post_id',postId).in('mentioned_user_id',remove);if(error)throw error;}
   if(add.length){const {error}=await supabase.from('post_mentions').insert(add.map(id=>({post_id:postId,mentioned_user_id:id})));if(error)throw error;}
  }
  async function refreshPostTags(ids){
   if(!supabase||!ids?.length)return;
   const {data,error}=await supabase.from('post_mentions').select('post_id,mentioned_user_id,mentioned:mentioned_user_id(id,handle,display_name)').in('post_id',ids);
   if(error){note('Tags unavailable: '+error.message);return;}
   setPostMentions(prev=>{const next={...prev};for(const id of ids)next[id]=[];for(const row of data||[]){const person=row.mentioned;if(person){(next[row.post_id]||=[]).push(person);}}return next;});
  }
  async function shareToTimeline(){if(!shareTarget||busy)return;setBusy(true);try{const originalId=shareTarget.shared_post_id||shareTarget.id;if(connected){const {error}=await supabase.from('posts').insert({author_id:session.user.id,team_id:shareTarget.team_id,body:shareText.trim(),shared_post_id:originalId,image_path:null,client_post_id:crypto.randomUUID()});if(error)throw error;await refresh();}else updateDemo(d=>({...d,posts:[{id:crypto.randomUUID(),author_id:d.profile?.handle,author:d.profile,team_id:shareTarget.team_id,body:shareText.trim(),shared_post_id:originalId,created_at:new Date().toISOString(),comments:0,reactionCount:0},...d.posts]}));setModal('');switchTeam('');setView('home');note('Shared to your timeline!');}catch(e){note('Share failed: '+e.message)}finally{setBusy(false)}}
  async function copyPostLink(post){const url=new URL(location.origin+location.pathname);url.searchParams.set('post',post.id);if(post.team_id)url.searchParams.set('team',post.team_id);try{await navigator.clipboard.writeText(url.toString());note('Post link copied.')}catch{note('Copy unavailable on this device.')}}
  async function reactToPost(post,reaction){if(!isMember){setModal('auth');return;}const old=selectedReaction(post);if(connected){const request=old===reaction?supabase.from('post_reactions').delete().eq('post_id',post.id).eq('user_id',session.user.id):supabase.from('post_reactions').upsert({post_id:post.id,user_id:session.user.id,reaction},{onConflict:'post_id,user_id'});const {error}=await request;if(error)return note('Reaction failed: '+error.message);await refresh();}else updateDemo(d=>{const next={...(d.reactions||{})};if(old===reaction)delete next[post.id];else next[post.id]=reaction;return {...d,reactions:next,posts:d.posts.map(p=>p.id===post.id?{...p,reactionCount:Math.max(0,(p.reactionCount||0)+(old===reaction?-1:old?0:1))}:p)}});}
  async function openPostNotification(entry){setNotificationsOpen(false);if(connected){const {error}=await supabase.from('activity_notifications').update({read_at:new Date().toISOString()}).eq('id',entry.item.id).eq('recipient_id',session.user.id);if(error)note('Could not mark alert read: '+error.message);await refreshActivity();}let post=loadedPosts.find(p=>p.id===entry.item.post_id);if(!post&&connected){const {data,error}=await supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,avatar_type,avatar_team_id,avatar_path)').eq('id',entry.item.post_id).maybeSingle();if(error)return note(error.message);if(data)post={...data,author:data.profiles};}if(post)openPostModal(post);else note('This post is no longer available.');}
  function startMessage(p){setMessageTarget(p.id);switchTeam('');setView('messages')}
 function openMessageNotification(entry){setNotificationsOpen(false);startMessage(entry.person)}
 async function returnBlitzNotification(entry){markActivityRead([entry.id]);if(supabase&&session?.user?.id){const {error}=await supabase.from('blitzes').update({read_at:new Date().toISOString()}).eq('id',entry.item.id).eq('recipient_id',session.user.id);if(error)note(error.message)}await blitzFriend(entry.person);await refreshActivity();setNotificationsOpen(false)}

 function sendDemoMessage(id,body){updateDemo(s=>({...s,messages:{...(s.messages||{}),[id]:[...((s.messages||{})[id]||[]),{id:crypto.randomUUID(),mine:true,body,created_at:new Date().toISOString()}]}}))}
 async function blitzFriend(p){if(relationshipFor(p)!=='accepted')return note('Blitzing is for friends only.');if(!connected){updateDemo(s=>({...s,blitzes:[...(s.blitzes||[]),{to:p.id,at:new Date().toISOString()}]}));return note(`Demo Blitz sent to ${p.display_name}!`)}const {error}=await supabase.from('blitzes').insert({sender_id:session.user.id,recipient_id:p.id});note(error?(error.message||'Unable to Blitz'):`You Blitzed ${p.display_name}!`)}
 async function refresh(){
  if(!supabase||!session?.user?.id){setPosts([]);setComments([]);setVotes([]);setReactions([]);return;}
  const [p,c,v,m,r]=await Promise.all([
   supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,favorite_cfb,avatar_type,avatar_team_id,avatar_path)').order('created_at',{ascending:false}).limit(100),
   supabase.from('comments').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,avatar_type,avatar_team_id,avatar_path)').order('created_at',{ascending:true}).limit(500),
   supabase.from('votes').select('post_id,user_id,value').limit(5000),
   supabase.from('post_media').select('id,post_id,kind,storage_path,position').order('position',{ascending:true}).limit(500),
    supabase.from('post_reactions').select('post_id,user_id,reaction').limit(5000)
  ]);
  if(p.error){note('Unable to load posts: '+p.error.message);return;}
  if(m.error){setMediaSetupError(m.error.message)}else setMediaSetupError('');if(r.error)note('Reactions unavailable: '+r.error.message);
  const mediaByPost={};for(const item of m.data||[]){const bucket=item.kind==='video'?'post-videos':'post-images';const mediaItem={...item,url:supabase.storage.from(bucket).getPublicUrl(item.storage_path).data.publicUrl};(mediaByPost[item.post_id]||=[]).push(mediaItem)}
  setPosts((p.data||[]).map(x=>({...x,author:x.profiles,image_url:x.image_path?supabase.storage.from('post-images').getPublicUrl(x.image_path).data.publicUrl:null,media:mediaByPost[x.id]||[],comments:(c.data||[]).filter(y=>y.post_id===x.id).length,score:(r.data||[]).filter(y=>y.post_id===x.id).length,reactionCount:(r.data||[]).filter(y=>y.post_id===x.id).length})));
  setComments(c.data||[]);setVotes(v.data||[]);setReactions(r.data||[]);
  if(p.data?.length)await refreshPostTags(p.data.map(x=>x.id));
   const knownIds=new Set((p.data||[]).map(v=>v.id));
   const refs=[...new Set((p.data||[]).map(v=>v.shared_post_id).filter(id=>id&&!knownIds.has(id)))];
   if(refs.length){const {data:sourcePosts,error:sourceError}=await supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,favorite_cfb,avatar_type,avatar_team_id,avatar_path)').in('id',refs).limit(100);
    if(!sourceError&&sourcePosts?.length){const {data:sourceMedia}=await supabase.from('post_media').select('id,post_id,kind,storage_path,position').in('post_id',refs);
     setSharedSources(sourcePosts.map(post=>({...post,author:post.profiles,media:(sourceMedia||[]).filter(m=>m.post_id===post.id).map(m=>({...m,url:supabase.storage.from(m.kind==='video'?'post-videos':'post-images').getPublicUrl(m.storage_path).data.publicUrl})),image_url:post.image_path?supabase.storage.from('post-images').getPublicUrl(post.image_path).data.publicUrl:null})));}
   }else setSharedSources([]);
   const {data:sharedRows}=await supabase.from('posts').select('shared_post_id').not('shared_post_id','is',null).limit(5000);if(sharedRows){const sums={};for(const row of sharedRows) sums[row.shared_post_id]=(sums[row.shared_post_id]||0)+1;setShareCounts(sums);}

 }
 useEffect(()=>{refresh()},[session?.user?.id]);
  const handledPostLinkRef=useRef('');
  useEffect(()=>{const id=new URLSearchParams(location.search).get('post');if(!id||!isMember||!authReady||!(!connected||profile?.onboarding_completed)||handledPostLinkRef.current===id)return;
   handledPostLinkRef.current=id;let active=true;
   const show=async()=>{let post=loadedPosts.find(p=>p.id===id);if(!post&&connected){const {data}=await supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,avatar_type,avatar_team_id,avatar_path)').eq('id',id).maybeSingle();if(data)post={...data,author:data.profiles};}if(active&&post)openPostModal(post);};show();return()=>{active=false};
  },[session?.user?.id,authReady,profile?.onboarding_completed,posts.length]);
 async function refreshSaved(){
  if(!supabase||!session?.user?.id){setSavedPostIds(demo.savedPosts||[]);setSavedPostsExtra([]);return;}
  const {data,error}=await supabase.from('saved_posts').select('post_id').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(500);
  if(error){note('Saved posts unavailable: '+error.message);return;}
  const ids=(data||[]).map(x=>x.post_id);setSavedPostIds(ids);
  if(!ids.length){setSavedPostsExtra([]);return;}
  const [postsResult, mediaResult]=await Promise.all([
   supabase.from('posts').select('*,profiles:author_id(display_name,handle,profile_visibility,favorite_nfl,favorite_cfb,avatar_type,avatar_team_id,avatar_path)').in('id',ids).limit(500),
   supabase.from('post_media').select('id,post_id,kind,storage_path,position').in('post_id',ids).limit(2000)
  ]);
  if(postsResult.error){note(postsResult.error.message);return;}
  const mediaByPost={};for(const item of mediaResult.data||[]){const bucket=item.kind==='video'?'post-videos':'post-images';(mediaByPost[item.post_id]||=[]).push({...item,url:supabase.storage.from(bucket).getPublicUrl(item.storage_path).data.publicUrl})}
  if(ids.length)await refreshPostTags(ids);
  setSavedPostsExtra((postsResult.data||[]).map(x=>({...x,author:x.profiles,image_url:x.image_path?supabase.storage.from('post-images').getPublicUrl(x.image_path).data.publicUrl:null,media:mediaByPost[x.id]||[]})));
 }
 async function toggleSavedPost(post){
  if(!isMember){setModal('auth');return;}
  const saved=savedPostIds.includes(post.id);
  if(!connected){const next=saved?savedPostIds.filter(id=>id!==post.id):[post.id,...savedPostIds];setSavedPostIds(next);updateDemo(d=>({...d,savedPosts:next}));return;}
  const {error}=saved?await supabase.from('saved_posts').delete().eq('user_id',session.user.id).eq('post_id',post.id):await supabase.from('saved_posts').insert({user_id:session.user.id,post_id:post.id});
  if(error){note('Could not update saved posts: '+error.message);return;}
  setSavedPostIds(prev=>saved?prev.filter(id=>id!==post.id):[post.id,...prev]);
  if(!saved)setSavedPostsExtra(prev=>[post,...prev.filter(x=>x.id!==post.id)]);
 }
 useEffect(()=>{refreshSaved()},[session?.user?.id,connected]);
 const savedPostsToShow=useMemo(()=>savedPostIds.map(id=>loadedPosts.find(p=>p.id===id)||savedPostsExtra.find(p=>p.id===id)).filter(Boolean),[savedPostIds,loadedPosts,savedPostsExtra]);

 const visiblePosts=useMemo(()=>{let arr=loadedPosts.filter(p=>!selectedTeam||p.team_id===selectedTeam).filter(p=>league==='ALL'||getTeam(p.team_id)?.league===league).filter(p=>!search||[p.body,getTeam(p.team_id)?.name,p.author?.display_name].join(' ').toLowerCase().includes(search.toLowerCase()));if(view==='following'&&!selectedTeam){const fav=[...(effectiveProfile?.favorite_nfl_teams||[effectiveProfile?.favorite_nfl]),...(effectiveProfile?.favorite_cfb_teams||[effectiveProfile?.favorite_cfb])];arr=arr.filter(p=>fav.includes(p.team_id))}return [...arr].sort((a,b)=>sort==='new'?new Date(b.created_at)-new Date(a.created_at):sort==='top'?(b.score||0)-(a.score||0):(b.score||0)/Math.pow(2+(Date.now()-new Date(b.created_at))/3600000,0.9)-(a.score||0)/Math.pow(2+(Date.now()-new Date(a.created_at))/3600000,0.9))},[loadedPosts,selectedTeam,league,sort,view,search,effectiveProfile]);
 const feedItems=useMemo(()=>{
  const postItems=(view==='friends'?visiblePosts.filter(isFriendPost):[...visiblePosts.filter(isNetworkPostItem),...visiblePosts.filter(p=>!isNetworkPostItem(p))]).map(p=>({type:'post',data:p,key:p.id}));
  if(selectedTeam||!['home','friends'].includes(view))return visiblePosts.map(p=>({type:'post',data:p,key:p.id}));
  if(view==='friends')return postItems;
  const pool=news.filter(n=>(league==='ALL'||n.league===league)&&(!search||n.title.toLowerCase().includes(search.toLowerCase())));
  const favs=[...(effectiveProfile?.favorite_nfl_teams||[]),...(effectiveProfile?.favorite_cfb_teams||[])].map(id=>getTeam(id)).filter(Boolean);
  const matchFavorite=n=>favs.some(t=>[t.name,t.name.split(' ').at(-1)].some(name=>name.length>3&&n.title.toLowerCase().includes(name.toLowerCase())));
  const selectedNews=pool.slice().sort((a,b)=>Number(matchFavorite(b))-Number(matchFavorite(a))||(hashString(a.id+mixSeed)-hashString(b.id+mixSeed))).slice(0,newsLimit);
  const result=[];let j=0;for(let i=0;i<postItems.length;i++){result.push(postItems[i]);for(let k=0;k<(postItems.length<5?3:1)&&j<selectedNews.length;k++){const n=selectedNews[j++];result.push({type:'news',data:n,key:'news-'+n.id})}}
  while(j<selectedNews.length){const n=selectedNews[j++];result.push({type:'news',data:n,key:'news-'+n.id})}
  return result;
 },[visiblePosts,selectedTeam,view,news,mixSeed,league,search,friendships,demo.friends,session?.user?.id,newsLimit,effectiveProfile]);
 function switchTeam(id){setSelectedTeam(id);setView('home');setSidebarOpen(false);const locationUrl=new URL(location.href);if(id)locationUrl.searchParams.set('team',id);else locationUrl.searchParams.delete('team');history.replaceState({},'',locationUrl)}
 function chooseProfilePhoto(e){
  const file=e.target.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){note('Choose a JPG, PNG or WebP profile photo.');return}
  if(file.size>2*1024*1024){note('Profile photos must be 2 MB or smaller.');return}
  setDraftAvatarFile(file);setDraftAvatarType('photo');setDraftAvatarPreview(URL.createObjectURL(file));
 }
 function choosePhoto(e){
  const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
  if(newVideo)return note('Choose photos or a video, not both. Remove the video first.');
  if(newPhotos.length+files.length>5)return note('Choose up to five photos per post.');
  for(const file of files){if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))return note('Choose JPG, PNG, WebP or GIF photos.');if(file.size>3*1024*1024)return note('Each photo must be 3 MB or smaller.');}
  setNewPhotos(prev=>[...prev,...files.map(file=>({file,url:URL.createObjectURL(file)}))]);
 }
 async function chooseVideo(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(newPhotos.length)return note('Remove your photos before adding a video.');
  if(!['video/mp4','video/webm'].includes(file.type))return note('Use an MP4 or WebM video.');
  if(file.size>50*1024*1024)return note('Videos must be 50 MB or smaller.');
  const localURL=URL.createObjectURL(file);
  try{const duration=await new Promise((resolve,reject)=>{const node=document.createElement('video');node.preload='metadata';node.onloadedmetadata=()=>resolve(node.duration);node.onerror=()=>reject(new Error('Cannot read video duration'));node.src=localURL});
   if(!Number.isFinite(duration)||duration<=0||duration>300){note('Videos must be five minutes or shorter.');URL.revokeObjectURL(localURL);return;}
   setNewVideo({file,duration});setVideoPreview(localURL);
  }catch(err){URL.revokeObjectURL(localURL);note(err.message||'Could not read video')}
 }
 async function submitPost(){
  if(submittingPostRef.current||busy)return;
  if(!newPost.trim()&&!attachedYoutubeId&&!newPhotos.length&&!newVideo)return note('Write something or add photos or video first.');
  if(!getTeam(newTeam))return note('Choose a team.');if(!isMember){setModal('auth');return}
  if(connected&&mediaSetupError&&(newPhotos.length||newVideo))return note('Media setup is required first. Please run the supplied LockerNoise SQL migration.');
  submittingPostRef.current=true;setBusy(true);setPostProgress('Saving your discussion…');const uploads=[];let createdPost=null;const submissionId=submissionIdRef.current||crypto.randomUUID();submissionIdRef.current=submissionId;
  try{
   if(connected){
    const {data,error}=await supabase.from('posts').insert({author_id:session.user.id,team_id:newTeam,body:newPost.trim(),youtube_video_id:attachedYoutubeId,image_path:null,client_post_id:submissionId}).select('id').single();if(error)throw error;createdPost=data.id;
    const selectedMedia=newVideo?[{kind:'video',file:newVideo.file}]:newPhotos.map(v=>({kind:'image',file:v.file}));
    for(let i=0;i<selectedMedia.length;i++){
     setPostProgress(`Uploading ${selectedMedia[i].kind==='video'?'video':`photo ${i+1} of ${selectedMedia.length}`}… please wait`);
      const entry=selectedMedia[i],ext=entry.file.type==='image/jpeg'?'jpg':entry.file.type==='image/png'?'png':entry.file.type==='image/webp'?'webp':entry.file.type==='image/gif'?'gif':entry.file.type==='video/mp4'?'mp4':'webm',bucket=entry.kind==='video'?'post-videos':'post-images',path=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
     const {error:uploadError}=await supabase.storage.from(bucket).upload(path,entry.file,{contentType:entry.file.type,upsert:false});if(uploadError)throw uploadError;uploads.push({bucket,path});
     const {error:metadataError}=await supabase.from('post_media').insert({post_id:createdPost,owner_id:session.user.id,kind:entry.kind,storage_path:path,position:i,duration_seconds:entry.kind==='video'?newVideo.duration:null});if(metadataError)throw metadataError;
    }
    setPostProgress('Finishing your post…');await synchronizeFriendTags(createdPost,newPost.trim());await refresh();
   }else{
    const attachments=await Promise.all(newPhotos.map(async (m,i)=>({id:`demo-photo-${i}`,kind:'image',url:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(m.file)})})));
    // Video previews are session-only in demo mode; don't put huge video blobs in localStorage.
    if(newVideo)note('Demo videos are not saved permanently. Connect Supabase for video publishing.');
    updateDemo(d=>({...d,posts:[{id:crypto.randomUUID(),team_id:newTeam,author:d.profile,body:newPost.trim(),youtube_video_id:attachedYoutubeId,media:attachments,created_at:new Date().toISOString(),score:0,comments:0},...d.posts]}));
   }
   submissionIdRef.current=null;setNewPost('');setAttachedYoutubeId(null);setNewPhotos([]);setNewVideo(null);setVideoPreview('');setModal('');switchTeam(newTeam);note('Your post is live!');
  }catch(err){
    if(connected){const {data:existing}=await supabase.from('posts').select('id').eq('author_id',session.user.id).eq('client_post_id',submissionId).maybeSingle();if(existing?.id){await refresh();note('Your post was saved, but the connection interrupted. Check that all photos or video appeared before posting again.');setModal('');submissionIdRef.current=null;}else note('Posting interrupted. You can retry safely without creating a duplicate.');}
    else note(err.message||'Could not publish post');
   }finally{setBusy(false);setPostProgress('');submittingPostRef.current=false}
 }
 async function castVote(post,value){if(!isMember){setModal('auth');return}if(connected){const previous=liked(post);if(previous===value){await supabase.from('votes').delete().eq('post_id',post.id).eq('user_id',session.user.id)}else{const {error}=await supabase.from('votes').upsert({post_id:post.id,user_id:session.user.id,value},{onConflict:'post_id,user_id'});if(error)note(error.message)}await refresh()}else updateDemo(s=>{const old=s.votes[post.id]||0;const next=old===value?0:value;return {...s,votes:{...s.votes,[post.id]:next},posts:s.posts.map(p=>p.id===post.id?{...p,score:(p.score||0)+next-old}:p)}})}
 async function addInlineComment(post,body,parentId=null){if(!isMember){setModal('auth');return}try{if(connected){const {error}=await supabase.from('comments').insert({post_id:post.id,author_id:session.user.id,body,parent_comment_id:parentId});if(error)throw error;await refresh();}else updateDemo(d=>({...d,comments:{...d.comments,[post.id]:[...(d.comments[post.id]||[]),{id:crypto.randomUUID(),body,created_at:new Date().toISOString(),author_id:d.profile?.handle,parent_comment_id:parentId,profiles:d.profile}]},posts:d.posts.map(p=>p.id===post.id?{...p,comments:(p.comments||0)+1}:p)}));}catch(e){note(e.message||'Could not post comment')}}
 async function submitComment(){if(!commentText.trim())return;if(!isMember){setModal('auth');return}setBusy(true);try{if(connected){const {error}=await supabase.from('comments').insert({post_id:modalPost.id,author_id:session.user.id,body:commentText.trim(),parent_comment_id:commentReplyTo});if(error)throw error;await refresh()}else updateDemo(s=>({...s,comments:{...s.comments,[modalPost.id]:[...(s.comments[modalPost.id]||[]),{id:crypto.randomUUID(),body:commentText.trim(),parent_comment_id:commentReplyTo,author_id:s.profile?.handle,created_at:new Date().toISOString(),profiles:s.profile}]},posts:s.posts.map(p=>p.id===modalPost.id?{...p,comments:p.comments+1}:p)}));setCommentText('');setCommentReplyTo(null)}catch(err){note(err.message||'Could not add comment')}finally{setBusy(false)}}
 async function sendSupportRequest({reply_email,category,details,honey}){
  if(honey)throw new Error('Unable to submit request.');
  if(!supabase)throw new Error('Support requires a connection to LockerNoise.');
  const id=crypto.randomUUID();
  const {error}=await supabase.from('support_requests').insert({
   id, user_id:session?.user?.id||null,
   reply_email:reply_email.trim().toLowerCase(),
   category,details:details.trim(),
   account_handle:session?.user?.id?(profile?.handle||null):null
  });
  if(error)throw new Error('Could not send request: '+error.message);
  return id;
 }
 async function readSupportRequests(){
  if(!supabase||!session?.user?.id)return [];
  const {data,error}=await supabase.from('support_requests').select('id,category,details,status,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(30);
  if(error)throw new Error('Could not load requests: '+error.message);
  return data||[];
 }
 async function authenticate(e){e.preventDefault();if(!connected){note('Demo mode: add your Supabase keys to enable real accounts.');return}setBusy(true);try{if(authMode==='signup'){const {data,error}=await supabase.auth.signUp({email:authEmail,password:authPassword,options:{data:{display_name:authName.trim()||'New Fan'}}});if(error)throw error;note(data.session?'Account created!':'Check your email to confirm your account.');if(!data.session)setModal('')}else{const {error}=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});if(error)throw error;note('Welcome back!');setModal('')}}catch(err){note(err.message)}finally{setBusy(false)}}
 function openSettings(){setDraftAvatarType(effectiveProfile?.avatar_type||'team');setDraftAvatarTeam(effectiveProfile?.avatar_team_id||effectiveProfile?.favorite_nfl||'');setDraftAvatarFile(null);setDraftAvatarPreview('');setDraftNFL(effectiveProfile?.favorite_nfl||'');setDraftCFB(effectiveProfile?.favorite_cfb||'');setDraftNFLTeams(effectiveProfile?.favorite_nfl_teams?.length?effectiveProfile.favorite_nfl_teams:(effectiveProfile?.favorite_nfl?[effectiveProfile.favorite_nfl]:[]));setDraftCFBTeams(effectiveProfile?.favorite_cfb_teams?.length?effectiveProfile.favorite_cfb_teams:(effectiveProfile?.favorite_cfb?[effectiveProfile.favorite_cfb]:[]));setDraftName(effectiveProfile?.display_name||'');setDraftBio(effectiveProfile?.bio||'');setDraftPrivacy(effectiveProfile?.profile_visibility||'public');setDraftAllowBlitz(effectiveProfile?.allow_blitz!==false);setModal('settings')}
 async function saveSettings(){
  if(busy)return;setBusy(true);let uploadedPhoto=null;
  try{
   if(draftNFLTeams.length===0)throw new Error('Choose at least one NFL team.');
   const chosenTeam=[...draftNFLTeams,...draftCFBTeams].includes(draftAvatarTeam)?draftAvatarTeam:draftNFLTeams[0];
   if(draftAvatarType==='photo'&&!draftAvatarFile&&!effectiveProfile?.avatar_path)throw new Error('Upload a profile photo or choose a team logo.');
   let avatarPath=effectiveProfile?.avatar_path||null;
   if(connected&&draftAvatarFile){
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[draftAvatarFile.type];
    avatarPath=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
    const {error}=await supabase.storage.from('profile-photos').upload(avatarPath,draftAvatarFile,{contentType:draftAvatarFile.type,upsert:false,cacheControl:'3600'});
    if(error)throw error;uploadedPhoto=avatarPath;
   } else if(!connected&&draftAvatarFile){avatarPath=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(draftAvatarFile)})}
   const updates={favorite_nfl:draftNFLTeams.includes(draftNFL)?draftNFL:draftNFLTeams[0],favorite_cfb:draftCFBTeams.includes(draftCFB)?draftCFB:(draftCFBTeams[0]||null),favorite_nfl_teams:draftNFLTeams,favorite_cfb_teams:draftCFBTeams,profile_visibility:draftPrivacy,allow_blitz:draftAllowBlitz,display_name:draftName.trim()||'Football fan',bio:draftBio.trim().slice(0,240),avatar_type:draftAvatarType,avatar_team_id:chosenTeam,avatar_path:avatarPath};
   if(connected){if(!isMember){setModal('auth');return}const {data,error}=await supabase.from('profiles').update(updates).eq('id',session.user.id).select().single();if(error)throw error;setProfile(data);await Promise.all([refresh(),refreshPeople()]);}
   else updateDemo(d=>({...d,profile:{...d.profile,...updates}}));
   setDraftAvatarFile(null);setDraftAvatarPreview('');setModal('');note('Profile, photo and favorite teams saved!');
  }catch(err){if(uploadedPhoto)await supabase.storage.from('profile-photos').remove([uploadedPhoto]);note(err.message||'Could not save profile')}
  finally{setBusy(false)}
 }
 async function completeOnboarding(){if(draftNFLTeams.length===0){note('Pick at least one NFL team.');return}setBusy(true);try{const {data,error}=await supabase.from('profiles').update({favorite_nfl:draftNFLTeams.includes(draftNFL)?draftNFL:draftNFLTeams[0],favorite_cfb:draftCFBTeams.includes(draftCFB)?draftCFB:(draftCFBTeams[0]||null),favorite_nfl_teams:draftNFLTeams,favorite_cfb_teams:draftCFBTeams,onboarding_completed:true}).eq('id',session.user.id).select().single();if(error)throw error;setProfile(data);note('Your LockerNoise feed is ready!')}catch(e){note(e.message)}finally{setBusy(false)}}
 function startPost(){if(!isMember){setModal('auth');return}setNewTeam(selectedTeam||effectiveProfile?.favorite_nfl||'TB');setModal('post')}
 const byPost=connected?comments.filter(c=>c.post_id===modalPost?.id):(demo.comments[modalPost?.id]||[]);
 const counts=useMemo(()=>TEAMS.reduce((a,t)=>(a[t.id]=loadedPosts.filter(p=>p.team_id===t.id).length,a),{}),[loadedPosts]);
 const supportModal=modal==='support'&&<Modal title="Help & Support" onClose={()=>setModal('')}><SupportCenter initialEmail={session?.user?.email||authEmail||''} isSignedIn={Boolean(session?.user)} onSubmit={sendSupportRequest} onLoadHistory={readSupportRequests}/></Modal>;

 if(!splashFinished || !authReady)return <LaunchSplash waitingForAuth={splashFinished&&!authReady}/>;
 if(connected&&!session)return <><div className="auth-screen"><div className="auth-card"><div className="auth-logo"><img className="auth-brand-lockup" src="/brand/lockernoise-header.png" alt="LockerNoise"/><span>WORKING NAME</span></div><h1>{authMode==='signup'?'Join the football conversation':'Welcome back, fan'}</h1><p>Everyone needs a free account to access the community. Choose multiple NFL and college teams after verifying your email.</p><div className="auth-theme"><span>Choose your look</span><ThemeChoices value={theme} onChange={chooseTheme}/></div><form className="auth-form" onSubmit={authenticate}>{authMode==='signup'&&<><label>Display name</label><input className="text-field" value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your fan name" maxLength={40} required/></>}<label>Email</label><input className="text-field" type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required/><label>Password</label><input className="text-field" type="password" minLength={8} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} required/><button className="primary-btn modal-cta" type="submit" disabled={busy}>{busy?'Please wait…':authMode==='signup'?'Create free account':'Sign in'}</button><button type="button" className="switch-auth" onClick={()=>setAuthMode(authMode==='signup'?'signin':'signup')}>{authMode==='signup'?'Already have an account? Sign in':'New fan? Create an account'}</button></form>{feedback&&<p className="auth-notice" role="status">{feedback}</p>}<button type="button" className="support-login-button" onClick={()=>setModal('support')}><HelpCircle size={16}/> Need help? Contact support</button><small>Independent, unofficial sports community. Brand and official team logos pending legal review.</small></div></div>{supportModal}</>;
 if(connected&&session&&!profile)return <div className="auth-screen"><div className="auth-card"><h2>Preparing your profile…</h2>{feedback&&<p>{feedback}</p>}</div></div>;
 if(connected&&session&&!profile.onboarding_completed)return <div className="auth-screen"><div className="onboard-card"><div className="onboard-top"><div className="auth-logo"><img className="auth-brand-lockup" src="/brand/lockernoise-header.png" alt="LockerNoise"/><span>WORKING NAME</span></div><small>Welcome, {profile.display_name}</small></div><div className="steps"><span className={onboardStep===1?'active':''}>1 · NFL favorites</span><span className={onboardStep===2?'active':''}>2 · College favorites</span></div><h1>{onboardStep===1?'Pick your NFL teams':'Now pick your college teams'}</h1><p>{onboardStep===1?'All 32 teams are here. Select as many as you support, and choose one primary team.':'Choose any college football teams you follow, or skip for now.'}</p><TeamMultiGrid league={onboardStep===1?'NFL':'CFB'} value={onboardStep===1?draftNFLTeams:draftCFBTeams} onChange={onboardStep===1?setDraftNFLTeams:setDraftCFBTeams} primary={onboardStep===1?draftNFL:draftCFB} onPrimary={onboardStep===1?setDraftNFL:setDraftCFB} requireOne={onboardStep===1}/><div className="onboard-buttons">{onboardStep===2&&<button type="button" className="secondary-btn" onClick={()=>setOnboardStep(1)}>← Back</button>}<button type="button" className="primary-btn" disabled={busy||onboardStep===1&&draftNFLTeams.length===0} onClick={()=>onboardStep===1?setOnboardStep(2):completeOnboarding()}>{busy?'Saving…':onboardStep===1?'Continue to college →':'Enter my huddle →'}</button></div>{feedback&&<p role="status">{feedback}</p>}<small>Teams may be changed later. Official logos will appear after their use is authorized.</small></div></div>;
 return <div className="site-shell">
 <header className="topbar"><div className="topbar-content"><button className="brand" onClick={()=>{switchTeam('');setView('home')}}><img className="brand-lockup" src="/brand/lockernoise-header.png" alt="LockerNoise" /><span className="beta">BETA</span></button><div className="top-search"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts, team communities, and fans…" aria-label="Search posts"/>{search&&<button onClick={()=>setSearch('')}><X size={16}/></button>}</div><div className="top-actions"><NotificationCenter open={notificationsOpen} onClose={{toggle:()=>{setNotificationsOpen(o=>!o);if(!notificationsOpen){refreshPeople();refreshActivity()}},close:()=>setNotificationsOpen(false)}} incoming={pendingFriendRequests} activity={receivedActivity} unreadKeys={unreadKeys} totalUnread={totalUnread} processing={notificationProcessing} onAccept={acceptNotification} onDecline={declineFriend} onChat={openMessageNotification} onBlitzBack={returnBlitzNotification} onPost={openPostNotification} onProfile={id=>{setNotificationsOpen(false);openMemberProfile(id)}} onMarkAll={markAllNotificationsRead}/><label className="header-theme-control"><Palette size={17} aria-hidden="true"/><select aria-label="Appearance theme" value={theme} onChange={e=>chooseTheme(e.target.value)}>{THEMES.map(t=><option key={t.id} value={t.id}>{t.short}</option>)}</select></label><button className="new-post-small" onClick={startPost}><Plus size={18}/> <span>Create post</span></button><button className="top-avatar" onClick={()=>{switchTeam('');setView('profile')}}><Avatar person={effectiveProfile} size={36}/><ChevronDown size={14}/></button><button className="menu-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu size={22}/></button></div></div></header>
 <main className="app-layout">{sidebarOpen&&<button type="button" className="sidebar-backdrop" aria-label="Close navigation menu" onClick={()=>setSidebarOpen(false)}/>}<aside className={`sidebar ${sidebarOpen?'shown':''}`}><div className="nav-group"><p className="nav-label">MAIN MENU</p><MenuIcon Icon={Home} active={view==='home'&&!selectedTeam} onClick={()=>{switchTeam('');setView('home')}}>Home feed</MenuIcon><MenuIcon Icon={UserRound} active={view==='profile'} onClick={()=>{switchTeam('');setView('profile')}}>My profile</MenuIcon><MenuIcon Icon={Compass} active={view==='explore'} onClick={()=>{switchTeam('');setView('explore')}}>Explore teams</MenuIcon><MenuIcon Icon={Heart} active={view==='following'} onClick={()=>{switchTeam('');setView('following')}}>My teams</MenuIcon><MenuIcon Icon={Users} active={view==='friendlist'} onClick={()=>{switchTeam('');setView('friendlist')}}>My friends ({acceptedFriends.length})</MenuIcon><MenuIcon Icon={Bookmark} active={view==='saved'} onClick={()=>{switchTeam('');setView('saved');refreshSaved()}}>Saved posts</MenuIcon><MenuIcon Icon={Users} active={view==='friends'} onClick={()=>{switchTeam('');setView('friends')}}>Friends feed</MenuIcon><MenuIcon Icon={MessageCircle} active={view==='messages'} badge={unreadMessages||null} onClick={()=>{switchTeam('');setView('messages')}}>Messages</MenuIcon><MenuIcon Icon={UserPlus} active={view==='people'} onClick={()=>{switchTeam('');setView('people')}}>Find fans</MenuIcon><MenuIcon Icon={Bell} active={notificationsOpen} badge={totalUnread||null} onClick={()=>{setNotificationsOpen(true);refreshPeople();refreshActivity();setSidebarOpen(false)}}>Notifications</MenuIcon><MenuIcon Icon={HelpCircle} active={modal==='support'} onClick={()=>{setSidebarOpen(false);setModal('support')}}>Help & Support</MenuIcon></div><div className="nav-group"><div className="nav-heading"><p className="nav-label">MY FAVORITE TEAMS</p><button onClick={openSettings} aria-label="Edit favorite teams"><Settings size={15}/></button></div>{[...new Set([...(effectiveProfile?.favorite_nfl_teams||[effectiveProfile?.favorite_nfl]),...(effectiveProfile?.favorite_cfb_teams||[effectiveProfile?.favorite_cfb])])].filter(id=>getTeam(id)).map(id=><button key={id} className="sidebar-team" onClick={()=>switchTeam(id)}><TeamName team={getTeam(id)} size={31}/></button>)}<button className="manage-teams" onClick={openSettings}><Plus size={15}/> Change my teams</button></div><div className="nav-group"><p className="nav-label">EXPLORE LEAGUES</p><MenuIcon Icon={Flame} active={league==='NFL'} onClick={()=>{switchTeam('');setLeague('NFL');setView('home')}}>NFL communities</MenuIcon><MenuIcon Icon={Users} active={league==='CFB'} onClick={()=>{switchTeam('');setLeague('CFB');setView('home')}}>College football</MenuIcon><MenuIcon Icon={Compass} active={league==='ALL'} onClick={()=>{switchTeam('');setLeague('ALL');setView('home')}}>All football</MenuIcon></div><div className="sidebar-foot"><span>Made for fans. Built for debate.</span><small>Unofficial fan community · Development v0.2</small></div></aside>
 <section className="feed-area"><div className="hero"><span className="eyebrow"><span className="live-dot"/> THE HOME OF FOOTBALL FANS</span><h1>{selected?<><span className="hero-team"><Logo team={selected} size={55}/></span>{selected.name}</>:view==='following'?'Your teams. Your people.':view==='friends'?'Your friends. Your feed.':view==='people'?'Find your football friends.':view==='friendlist'?'Your fan friends.':view==='saved'?'Your saved posts.':view==='messages'?'Talk to your teammates.':view==='explore'?'Find your football community.':'Every fan has a voice.'}</h1><p>{selected?`The ${leagueName(selected.league)} community for ${selected.name} fans. Join the conversation.`:'The ultimate fan zone for NFL and college football. Talk trash, share takes, and rep your squad.'}</p><div className="hero-actions"><button className="primary-btn" onClick={startPost}><Plus size={18}/> Start a discussion</button><button className="secondary-btn" onClick={()=>{switchTeam('');setView('explore')}}>Browse communities <ArrowUpRight size={15}/></button></div></div>
 {view==='profile'&&!selected?<div className="profile-page"><div className="profile-cover"><Avatar person={effectiveProfile} size={94}/><div><h2>{effectiveProfile?.display_name||'Football fan'}</h2><p>@{effectiveProfile?.handle||'fan'}</p><p>{effectiveProfile?.bio||'Add a short bio so other fans can get to know you.'}</p><div className="profile-teams">{[...new Set([...(effectiveProfile?.favorite_nfl_teams||[]),...(effectiveProfile?.favorite_cfb_teams||[])])].filter(id=>getTeam(id)).map(id=><TeamName key={id} team={getTeam(id)} size={24} onClick={()=>switchTeam(id)}/>)}</div></div><button className="primary-btn" onClick={openSettings}><Settings size={16}/> Edit profile</button></div><div className="section-heading"><div><h2>My posts</h2><p>Your LockerNoise discussions and photos</p></div></div><div className="posts-list">{loadedPosts.filter(p=>p.author_id===session?.user?.id||(!connected&&p.author?.handle===demo.profile?.handle)).map(p=><Post key={p.id} post={p} taggedUsers={postMentions[p.id]||[]} onProfile={openMemberProfile} onOpenOriginal={openPostModal} onReact={reactToPost} reaction={selectedReaction(p)} onShare={openShare} shareCount={shareCounts[p.id]||0} onEdit={p.author_id===session?.user?.id||(!connected&&p.author?.handle===demo.profile?.handle)?openEdit:null} originalPost={loadedPosts.find(o=>o.id===p.shared_post_id)||sharedSources.find(o=>o.id===p.shared_post_id)||savedPostsExtra.find(o=>o.id===p.shared_post_id)} setSelectedTeam={switchTeam} vote={liked(p)} onVote={castVote} onComment={()=>{}} postComments={connected?comments.filter(c=>c.post_id===p.id):demo.comments[p.id]||[]} onInlineComment={addInlineComment} saved={savedPostIds.includes(p.id)} onToggleSave={toggleSavedPost} currentUser={session?.user} report={x=>{setModalPost(x);setModal('report')}}/>)}{!loadedPosts.some(p=>p.author_id===session?.user?.id||(!connected&&p.author?.handle===demo.profile?.handle))&&<div className="no-posts"><p>No posts yet. Share your first football take!</p><button className="primary-btn" onClick={startPost}>Create a post</button></div>}</div></div>:view==='member'&&!selected&&memberProfile?<div className="profile-page"><div className="profile-cover"><Avatar person={memberProfile} size={94}/><div><h2>{memberProfile.display_name||'Football fan'}</h2><p>@{memberProfile.handle||'fan'}</p><p>{memberProfile.bio||'Football community member'}</p><div className="profile-teams">{[...new Set([...(memberProfile.favorite_nfl_teams||[memberProfile.favorite_nfl]),...(memberProfile.favorite_cfb_teams||[memberProfile.favorite_cfb])])].filter(id=>getTeam(id)).map(id=><TeamName key={id} team={getTeam(id)} size={24} onClick={()=>switchTeam(id)}/>)}</div></div>{relationshipFor(memberProfile)==='accepted'&&<button className="primary-btn" onClick={()=>startMessage(memberProfile)}><MessageCircle size={16}/> Message</button>}</div>{memberProfile.profile_visibility==='private'&&relationshipFor(memberProfile)!=='accepted'?<div className="no-posts"><Lock size={24}/><h3>Private profile</h3><p>Add this fan as a friend to view their profile posts.</p><button onClick={()=>toggleFriend(memberProfile,relationshipFor(memberProfile))} className="primary-btn">Add friend</button></div>:<><div className="section-heading"><div><h2>{memberProfile.display_name}'s posts</h2><p>Newest discussions first</p></div></div><div className="posts-list">{memberPosts.map(p=><Post key={p.id} post={p} taggedUsers={postMentions[p.id]||[]} onProfile={openMemberProfile} onOpenOriginal={openPostModal} onReact={reactToPost} reaction={selectedReaction(p)} onShare={openShare} shareCount={shareCounts[p.id]||0} originalPost={loadedPosts.find(o=>o.id===p.shared_post_id)||sharedSources.find(o=>o.id===p.shared_post_id)||memberPosts.find(o=>o.id===p.shared_post_id)} setSelectedTeam={switchTeam} vote={liked(p)} onVote={castVote} postComments={connected?comments.filter(c=>c.post_id===p.id):demo.comments[p.id]||[]} onInlineComment={addInlineComment} saved={savedPostIds.includes(p.id)} onToggleSave={toggleSavedPost} report={x=>{setModalPost(x);setModal('report')}}/>)}{!memberPosts.length&&!memberBusy&&<p className="empty">No posts to show yet.</p>}</div>{memberMore&&<button type="button" className="load-news" disabled={memberBusy} onClick={()=>loadMemberPosts(memberProfile.id,memberPosts.length)}>{memberBusy?'Loading…':'Load more posts'}</button>}</>}</div>:view==='friendlist'&&!selected?<div className="people-section"><div className="section-heading"><div><h2>My friends</h2><p>{acceptedFriends.length} {acceptedFriends.length===1?'friend':'friends'} · Message, Blitz or remove friends here.</p></div></div>{acceptedFriends.length?<div className="people-list">{acceptedFriends.map(p=><PeopleCard key={p.id} person={p} onProfile={openMemberProfile} relationship="accepted" onClick={toggleFriend} onMessage={startMessage} onBlitz={blitzFriend}/>)}</div>:<div className="no-posts"><Users size={32}/><h3>No friends yet</h3><p>Meet football fans and send a friend request.</p><button className="primary-btn" onClick={()=>setView('people')}>Find fans</button></div>}</div>:view==='saved'&&!selected?<div className="people-section"><div className="section-heading"><div><h2>Saved posts</h2><p>Only you can see your saved posts.</p></div></div><div className="posts-list">{savedPostsToShow.length?savedPostsToShow.map(p=><Post key={p.id} post={p} taggedUsers={postMentions[p.id]||[]} onProfile={openMemberProfile} onOpenOriginal={openPostModal} onReact={reactToPost} reaction={selectedReaction(p)} onShare={openShare} shareCount={shareCounts[p.id]||0} onEdit={p.author_id===session?.user?.id||(!connected&&p.author?.handle===demo.profile?.handle)?openEdit:null} originalPost={loadedPosts.find(o=>o.id===p.shared_post_id)||sharedSources.find(o=>o.id===p.shared_post_id)||savedPostsExtra.find(o=>o.id===p.shared_post_id)} setSelectedTeam={switchTeam} vote={liked(p)} onVote={castVote} postComments={connected?comments.filter(c=>c.post_id===p.id):demo.comments[p.id]||[]} onInlineComment={addInlineComment} saved={true} onToggleSave={toggleSavedPost} report={x=>{setModalPost(x);setModal('report')}}/>):<div className="no-posts"><Bookmark size={32}/><h3>Nothing saved yet</h3><p>Tap Save on any discussion to find it here later.</p><button className="primary-btn" onClick={()=>setView('home')}>Explore posts</button></div>}</div></div>:view==='messages'&&!selected?<div className="people-section"><div className="section-heading"><div><h2>Private messages</h2><p>Chat one-on-one with accepted friends.</p></div></div>{!connected&&<p className="preview-warning">Demo mode: messages stay in this browser; nobody else receives them.</p>}<MessageCenter friends={directory.filter(p=>relationshipFor(p)==='accepted')} userId={session?.user?.id} connected={connected} demoMessages={demo.messages||{}} onDemoSend={sendDemoMessage} initialFriendId={messageTarget} note={note} onReadConversation={markConversationRead} unreadByFriend={unreadByFriend}/></div>:view==='people'&&!selected?<div className="people-section"><div className="section-heading"><div><h2>Meet other fans</h2><p>Send a friend request, accept an invitation, and follow each other's posts.</p></div></div>{!connected&&<p className="preview-warning">Preview mode: friend connections are saved only in your browser. Live invitations require a connected database.</p>}{connected&&!isMember&&<p className="preview-warning">Sign in to send and accept friend requests.</p>}{directory.filter(p=>relationshipFor(p)==='incoming').length>0&&<><h3>Friend requests</h3>{directory.filter(p=>relationshipFor(p)==='incoming').map(p=><PeopleCard key={p.id} person={p} onProfile={openMemberProfile} relationship="incoming" onClick={toggleFriend} onMessage={startMessage} onBlitz={blitzFriend}/>)}</>}<h3>Fans you may know</h3><div className="people-list">{directory.filter(p=>!search||[p.display_name,p.handle].join(' ').toLowerCase().includes(search.toLowerCase())).map(p=><PeopleCard key={p.id} person={p} onProfile={openMemberProfile} relationship={relationshipFor(p)} onClick={toggleFriend} onMessage={startMessage} onBlitz={blitzFriend}/>)}</div>{directory.length===0&&<p className="empty">No members yet. Invite the first football fans when registration is enabled!</p>}</div>:view==='explore'&&!selected?<div className="explore-section"><div className="section-heading"><div><h2>Discover communities</h2><p>Choose a team to join the conversation.</p></div></div><div className="league-tabs"><button className={league==='ALL'?'selected':''} onClick={()=>setLeague('ALL')}>All teams</button><button className={league==='NFL'?'selected':''} onClick={()=>setLeague('NFL')}>NFL</button><button className={league==='CFB'?'selected':''} onClick={()=>setLeague('CFB')}>College football</button></div><div className="explore-grid">{TEAMS.filter(t=>league==='ALL'||t.league===league).filter(t=>!search||t.name.toLowerCase().includes(search.toLowerCase())).map(team=><button key={team.id} className="explore-tile" onClick={()=>switchTeam(team.id)}><div className="explore-tile-title"><TeamName team={team} size={34}/></div><small>{leagueName(team.league)} · {counts[team.id]||0} posts</small></button>)}</div></div>:<><div className="compose-card" onClick={startPost} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&startPost()}><Avatar person={effectiveProfile}/><div className="compose-placeholder">What's your football take, {effectiveProfile?.display_name?.split(' ')[0]||'fan'}?</div><button onClick={e=>{e.stopPropagation();startPost()}}><ImageIcon size={19}/> <span>Photo</span></button></div><div className="section-heading"><div><h2>{selected?'Team discussions':view==='following'?'From your favorites':view==='friends'?'From your friends':league==='NFL'?'NFL discussions':league==='CFB'?'College football discussions':'Trending discussions'}</h2><p>{view==='friends'?feedItems.length:visiblePosts.length} {(view==='friends'?feedItems.length:visiblePosts.length)===1?'discussion':'discussions'} to explore</p></div><div className="sort-control"><button className={sort==='hot'?'selected':''} onClick={()=>chooseSort('hot')}><Flame size={15}/> Hot</button><button className={sort==='new'?'selected':''} onClick={()=>chooseSort('new')}>New</button><button className={sort==='top'?'selected':''} onClick={()=>chooseSort('top')}>Top</button></div></div>{view==='home'&&!selectedTeam&&<div className="feed-explainer"><Users size={16}/> Friends' posts first, with fresh NFL and college-football news sprinkled in. <button onClick={()=>setMixSeed(x=>x+1)}><RefreshCw size={14}/> Mix news</button></div>}{view==='home'&&!selectedTeam&&newsStatus!=='ready'&&<div className="news-status"><Newspaper size={17}/>{newsStatus==='loading'?'Checking NFL and college football headlines…':newsStatus==='unavailable'?'Live news will appear when the Netlify news service is available.':'No current headlines from the news source.'}</div>}<div className="posts-list">{feedItems.length?feedItems.map(item=>item.type==='news'?<NewsCard key={item.key} article={item.data} onTeam={switchTeam}/>:<Post key={item.key} post={item.data} taggedUsers={postMentions[item.data.id]||[]} onProfile={openMemberProfile} onOpenOriginal={openPostModal} onReact={reactToPost} reaction={selectedReaction(item.data)} onShare={openShare} shareCount={shareCounts[item.data.id]||0} onEdit={item.data.author_id===session?.user?.id||(!connected&&item.data.author?.handle===demo.profile?.handle)?openEdit:null} originalPost={loadedPosts.find(o=>o.id===item.data.shared_post_id)||sharedSources.find(o=>o.id===item.data.shared_post_id)||savedPostsExtra.find(o=>o.id===item.data.shared_post_id)} selectedTeam={selectedTeam} setSelectedTeam={switchTeam} onVote={castVote} onComment={post=>{setModalPost(post);setCommentText('');setModal('comments')}} postComments={connected?comments.filter(c=>c.post_id===item.data.id):demo.comments[item.data.id]||[]} onInlineComment={addInlineComment} saved={savedPostIds.includes(item.data.id)} onToggleSave={toggleSavedPost} vote={liked(item.data)} currentUser={session?.user} report={p=>{setModalPost(p);setModal('report')}}/>):<div className="no-posts"><MessageCircle size={32}/><h3>{view==='friends'?'No friends posts yet':'No discussions yet'}</h3><p>{view==='friends'?'Find fans and add friends to fill your feed.':'Be the first fan to post in this community.'}</p><button className="primary-btn" onClick={startPost}>Start a discussion</button></div>}</div>{view==='home'&&!selectedTeam&&news.length>newsLimit&&<button type="button" className="load-news" onClick={()=>setNewsLimit(x=>x+12)}>Load more football news ({news.length-newsLimit} more) <Newspaper size={17}/></button>}</>}
 </section><aside className="rightbar"><div className="right-card"><div className="right-card-head"><span className="spotlight-ball">🏆</span><div><h3>Welcome to LockerNoise</h3><p>Friends + football news</p></div></div><p>Your home feed features friends first, then headlines and conversations from across football.</p><button className="outline-btn" onClick={openSettings}>Customize your teams <ArrowUpRight size={15}/></button></div><div className="right-card"><div className="side-title"><h3>Your fan network</h3><Users size={17}/></div><p>Follow the game with friends, even if you support rival teams.</p><button className="outline-btn" onClick={()=>{switchTeam('');setView('people')}}><UserPlus size={16}/> Find fans</button></div><div className="right-card"><div className="side-title"><h3>Fan favorite teams</h3><span>Explore</span></div>{['TB','JAX','FLA','FSU','UGA','OSU'].map(id=><button key={id} className="hot-team" onClick={()=>switchTeam(id)}><TeamName team={getTeam(id)} size={29}/><ArrowUpRight size={15}/></button>)}</div><div className="right-card guidelines"><div className="side-title"><h3>Community playbook</h3><ShieldAlert size={17}/></div><p>Respect other fans. No hate, harassment, spam, or stolen content. Keep debates about sports.</p><button onClick={()=>setModal('rules')}>Read community rules <ArrowUpRight size={14}/></button></div></aside></main>
 {supportModal}
 {feedback&&<div className="toast" role="status">{feedback}</div>}
 {modal==='post'&&<Modal title="Start a discussion" onClose={()=>{if(!busy)setModal('')}}><div className="modal-content"><label className="field-label">Choose a community</label><TeamPicker value={newTeam} onChange={setNewTeam} favoriteIds={[...(effectiveProfile?.favorite_nfl_teams||[]),...(effectiveProfile?.favorite_cfb_teams||[])]}/><label className="field-label" htmlFor="compose-body">What's on your mind?</label><textarea id="compose-body" className="post-textarea" placeholder="Share a prediction, question, hot take, or game day moment…" value={newPost} maxLength={2000} onChange={e=>changeComposeText(e.target.value)} rows={5}/><FriendMentionSuggestions text={newPost} friends={acceptedFriends} onChange={changeComposeText}/><p className="friend-tag-hint">Type @ to tag a friend. Only accepted friends can be tagged.</p>
 {attachedYoutubeId&&<div className="attached-youtube"><div className="attached-youtube-head"><span><Check size={16}/> YouTube video attached — write your own caption above</span><button type="button" onClick={()=>setAttachedYoutubeId(null)} aria-label="Remove attached YouTube video"><X size={15}/> Remove</button></div><YouTubeEmbed videoId={attachedYoutubeId} compact/></div>}{newPhotos.length>0&&<div className="compose-gallery">{newPhotos.map((m,i)=><div key={m.url} className="compose-thumb"><img src={m.url} alt={`Selected photo ${i+1}`}/><button type="button" aria-label="Remove photo" onClick={()=>setNewPhotos(arr=>arr.filter(item=>item!==m))}><X size={15}/></button>{i>0&&<button type="button" aria-label="Move photo left" className="move-photo" onClick={()=>setNewPhotos(arr=>{const n=[...arr];[n[i-1],n[i]]=[n[i],n[i-1]];return n})}>←</button>}</div>)}</div>}
 {newVideo&&<div className="compose-video"><video src={videoPreview} controls playsInline preload="metadata"/><button type="button" onClick={()=>{setNewVideo(null);setVideoPreview('')}}><Trash2 size={16}/> Remove video</button><small>{Math.round(newVideo.duration)} seconds · {(newVideo.file.size/1048576).toFixed(1)} MB</small></div>}
 <div className="compose-bottom"><label className="upload-action"><ImageIcon size={19}/> Photos ({newPhotos.length}/5)<input hidden multiple type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={choosePhoto}/></label><label className="upload-action"><Video size={19}/> Video (≤5 min)<input hidden type="file" accept="video/mp4,video/webm" onChange={chooseVideo}/></label><span>{newPost.length}/2000</span></div><p className="field-hint">Choose up to five photos (3 MB each) or one MP4/WebM video (50 MB, 5 minutes). Posts are visible in team communities.</p><button disabled={busy} className="primary-btn modal-cta" onClick={submitPost}>{busy?(postProgress||'Posting…'):'Publish discussion'} <Send size={16}/></button></div></Modal>}
 {modal==='edit'&&editTarget&&<Modal title="Edit your post" onClose={()=>setModal('')}><div className="modal-content"><p className="field-hint">Edit your writing without losing comments, reactions, or shares. Removing a post is not available.</p><textarea className="post-textarea" rows={6} maxLength={2000} value={editText} onChange={e=>changeEditText(e.target.value)}/><FriendMentionSuggestions text={editText} friends={acceptedFriends} onChange={changeEditText}/>{editYoutubeId&&<div className="attached-youtube"><div className="attached-youtube-head"><span><Check size={16}/> Attached YouTube video stays with this post</span><button type="button" onClick={()=>setEditYoutubeId(null)} aria-label="Remove attached YouTube video"><X size={15}/> Remove</button></div><YouTubeEmbed videoId={editYoutubeId} compact/></div>}<button className="primary-btn modal-cta" type="button" onClick={saveEdit} disabled={busy}>{busy?'Saving…':'Save changes'} <Check size={16}/></button></div></Modal>}
  {modal==='share'&&shareTarget&&<Modal title="Share this post" onClose={()=>setModal('')}><div className="modal-content"><p>Share this discussion on your LockerNoise timeline with credit to the original author.</p><textarea className="post-textarea" rows={3} maxLength={1000} value={shareText} onChange={e=>setShareText(e.target.value)} placeholder="Say something about this post (optional)…"/><div className="share-options"><button type="button" className="primary-btn" disabled={busy} onClick={shareToTimeline}><Repeat2 size={17}/> {busy?'Sharing…':'Share to my timeline'}</button><button type="button" className="secondary-btn" onClick={()=>copyPostLink(shareTarget)}><Copy size={17}/> Copy link</button>{typeof navigator!=='undefined'&&navigator.share&&<button type="button" className="secondary-btn" onClick={()=>{const url=new URL(location.origin+location.pathname);url.searchParams.set('post',shareTarget.id);navigator.share({title:'LockerNoise post',url:url.toString()}).catch(()=>{})}}><ExternalLink size={17}/> Share outside LockerNoise</button>}</div></div></Modal>}
  {modal==='viewpost'&&modalPost&&<PostDetailViewer post={modalPost} taggedUsers={postMentions[modalPost.id]||[]} photos={(modalPost.media?.length?modalPost.media:(modalPost.image_url?[{url:modalPost.image_url,kind:'image'}]:[])).filter(m=>m.kind==='image')} video={(modalPost.media||[]).find(m=>m.kind==='video')} onClose={()=>setModal('')} comments={byPost} onReply={addInlineComment} onTeam={id=>{setModal('');switchTeam(id)}} onProfile={id=>{setModal('');openMemberProfile(id)}} saved={savedPostIds.includes(modalPost.id)} onToggleSave={toggleSavedPost} reaction={selectedReaction(modalPost)} onReact={reactToPost} onShare={p=>{setModal('');openShare(p)}} onEdit={modalPost.author_id===session?.user?.id||(!connected&&modalPost.author?.handle===demo.profile?.handle)?p=>{setModal('');openEdit(p)}:null}/>}
  {modal==='comments'&&modalPost&&<Modal title="Discussion" onClose={()=>setModal('')}><div className="modal-content comment-view"><div className="discussion-origin"><TeamName team={getTeam(modalPost.team_id)} size={23} onClick={()=>{switchTeam(modalPost.team_id);setModal('')}}/><p><RichTeamText text={modalPost.body} onTeam={switchTeam}/></p></div><h3>Comments</h3><div className="comment-list">{byPost.length?byPost.map((c,i)=><div key={c.id||i} className={`comment-item ${c.parent_comment_id?"reply-item":""}`}><Avatar person={c.profiles} size={33}/><div><button type="button" className="author-link" onClick={()=>{setModal('');openMemberProfile(c.author_id)}}>{c.profiles?.display_name||'Fan'}</button><small><Ago date={c.created_at}/></small><p><RichTeamText text={c.body} onTeam={switchTeam}/></p><button type="button" className="reply-comment" onClick={()=>setCommentReplyTo(c.id)}>Reply</button></div></div>):<p className="empty">No comments yet. Start the conversation!</p>}</div><div className="comment-entry"><textarea value={commentText} onChange={e=>setCommentText(e.target.value)} maxLength={1000} rows={2} placeholder={commentReplyTo?"Replying to this comment…":"Add to the conversation…"}/>{commentReplyTo&&<button className="secondary-btn" type="button" onClick={()=>setCommentReplyTo(null)}>Cancel reply</button>}<button className="primary-btn" onClick={submitComment} disabled={busy||!commentText.trim()}><Send size={17}/></button></div></div></Modal>}
 {modal==='settings'&&<Modal title="Your fan profile" onClose={()=>setModal('')}><div className="modal-content"><label className="field-label">Profile picture</label>
 <p className="theme-caption">Choose any of your favorite teams' logos or upload your own photo. Your avatar appears with your posts, messages and comments.</p>
 <div className="avatar-preferences"><Avatar person={{...effectiveProfile,avatar_type:draftAvatarType,avatar_team_id:draftAvatarTeam,avatar_path:effectiveProfile?.avatar_path}} previewSrc={draftAvatarPreview} size={78}/><div className="avatar-preference-options"><label className="avatar-option"><input type="radio" name="avatar-mode" value="team" checked={draftAvatarType==='team'} onChange={()=>setDraftAvatarType('team')}/> Use a team logo</label><label className="avatar-option"><input type="radio" name="avatar-mode" value="photo" checked={draftAvatarType==='photo'} onChange={()=>setDraftAvatarType('photo')}/> Use my photo</label></div></div>
 {draftAvatarType==='team'?<div className="avatar-team-options">{[...new Set([...draftNFLTeams,...draftCFBTeams])].filter(id=>getTeam(id)).map(id=><button key={id} type="button" aria-pressed={draftAvatarTeam===id} className={`avatar-team-choice ${draftAvatarTeam===id?'chosen':''}`} onClick={()=>setDraftAvatarTeam(id)}><Logo team={getTeam(id)} size={32}/><span>{getTeam(id).name}</span>{draftAvatarTeam===id&&<Check size={16}/>}</button>)}</div>:<div className="avatar-upload-box"><label className="upload-action"><Camera size={19}/> {effectiveProfile?.avatar_path?'Change photo':'Upload profile photo'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={chooseProfilePhoto}/></label><small>JPG, PNG or WebP · maximum 2 MB. Uploaded profile images are public.</small></div>}
 <label className="field-label">Appearance</label><p className="theme-caption">Choose a look for LockerNoise. Your choice applies immediately and follows your account on the website and Android.</p><ThemeChoices value={theme} onChange={chooseTheme}/><label className="privacy-switch"><span><Volume2 size={16}/> Play intro sound when LockerNoise opens</span><input type="checkbox" checked={introSoundEnabled} onChange={e=>setIntroSoundEnabled(e.target.checked)}/></label><p className="field-hint">Some mobile browsers require a tap before playing sound automatically.</p><label className="field-label">Display name</label><input className="text-field" value={draftName} onChange={e=>setDraftName(e.target.value)} maxLength={40}/><label className="field-label">About me</label><textarea className="post-textarea" rows={3} maxLength={240} placeholder="Your football bio…" value={draftBio} onChange={e=>setDraftBio(e.target.value)}/><label className="field-label">Your NFL teams</label><TeamMultiGrid league="NFL" value={draftNFLTeams} onChange={setDraftNFLTeams} primary={draftNFL} onPrimary={setDraftNFL} requireOne/><label className="field-label">Your college football teams (optional)</label><TeamMultiGrid league="CFB" value={draftCFBTeams} onChange={setDraftCFBTeams} primary={draftCFB} onPrimary={setDraftCFB}/><div className="privacy-switch"><div><b>Profile visibility</b><p className="privacy-copy">Public or private preferences. Team-community posts remain public. Full personal-profile privacy is still under development.</p></div><select value={draftPrivacy} onChange={e=>setDraftPrivacy(e.target.value)} aria-label="Profile visibility"><option value="public">Public</option><option value="private">Private</option></select></div><label className="privacy-switch"><span>Let friends Blitz me ⚡</span><input type="checkbox" checked={draftAllowBlitz} onChange={e=>setDraftAllowBlitz(e.target.checked)}/></label><p className="field-hint">Pick as many teams as you support; star your main favorite. You can change selections any time. Official logo assets require authorization before launch.</p><button disabled={busy} className="primary-btn modal-cta" onClick={saveSettings}>{busy?'Saving…':'Save my favorites'} <Check size={17}/></button>{connected&&isMember&&<button className="sign-out" onClick={async()=>{await supabase.auth.signOut();setModal('');note('Signed out')}}><LogOut size={16}/> Sign out</button>}{!connected&&<p className="field-hint">Preview mode: preferences are saved only on this device.</p>}</div></Modal>}
 {modal==='auth'&&<Modal title={authMode==='signup'?'Join LockerNoise':'Welcome back'} onClose={()=>setModal('')}><form className="modal-content" onSubmit={authenticate}>{!connected&&<p className="preview-warning">Live registration needs a connected Supabase project. You can explore the interactive demo right now.</p>}{authMode==='signup'&&<><label className="field-label">Display name</label><input className="text-field" value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your fan name" required/></>}<label className="field-label">Email</label><input className="text-field" type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required/><label className="field-label">Password</label><input className="text-field" type="password" minLength={8} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} required/><button disabled={busy||!connected} className="primary-btn modal-cta" type="submit">{authMode==='signup'?'Create free account':'Sign in'}</button><button className="switch-auth" type="button" onClick={()=>setAuthMode(authMode==='signup'?'signin':'signup')}>{authMode==='signup'?'Already a member? Sign in':'New to LockerNoise? Create an account'}</button></form></Modal>}
 {modal==='report'&&<Modal title="Report a post" onClose={()=>setModal('')}><div className="modal-content"><p>Help keep this community respectful. In the preview, reports are not submitted. The production version should route reports to an admin moderation queue.</p><button className="primary-btn modal-cta" onClick={()=>{setModal('');note('Reporting will be enabled with the live moderation system.')}}>Close</button></div></Modal>}
 {modal==='rules'&&<Modal title="Community playbook" onClose={()=>setModal('')}><div className="modal-content rule-list"><p><b>1. Play fair.</b> Debate teams and players without attacking people.</p><p><b>2. Zero tolerance for hate.</b> No harassment, slurs, threats, or discriminatory content.</p><p><b>3. Keep it authentic.</b> No spam, impersonation, scams, or copyright-infringing uploads.</p><p><b>4. Stay on topic.</b> Post in the most relevant team community.</p><p><b>5. Protect privacy.</b> Never publish private information about someone else.</p></div></Modal>}
 <footer className="mobile-footer"><button onClick={()=>{switchTeam('');setView('home')}}><Home size={21}/>Home</button><button onClick={()=>{switchTeam('');setView('explore')}}><Compass size={21}/>Teams</button><button className="mobile-post" onClick={startPost}><Plus size={23}/></button><button className="mobile-chat-action" onClick={()=>{switchTeam('');setView('messages')}}><MessageCircle size={21}/>Chat{unreadMessages>0&&<span className="message-unread-badge mobile-chat-badge">{unreadMessages>99?'99+':unreadMessages}</span>}</button><button onClick={openSettings}><Settings size={21}/>Profile</button></footer>
 </div>;
}
