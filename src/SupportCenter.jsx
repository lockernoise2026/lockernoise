import React,{useState} from 'react';
import {HelpCircle,UserRound,Image,Users,Bell,Bug,Lightbulb,Send,CheckCircle,ExternalLink} from 'lucide-react';

const categories=[
 {id:'account',name:'Account / Login',Icon:UserRound},
 {id:'posting',name:'Posting / Photos / Video',Icon:Image},
 {id:'friends',name:'Friends / Messages',Icon:Users},
 {id:'notifications',name:'Notifications',Icon:Bell},
 {id:'bug',name:'Report a Bug',Icon:Bug},
 {id:'suggestion',name:'Suggestion / Other',Icon:Lightbulb},
];
export default function SupportCenter({initialEmail='',isSignedIn=false,onSubmit,onLoadHistory}){
 const [category,setCategory]=useState('bug');
 const [email,setEmail]=useState(initialEmail);
 const [details,setDetails]=useState('');
 const [website,setWebsite]=useState(''); // hidden spam trap; should remain empty
 const [sending,setSending]=useState(false);
 const [error,setError]=useState('');
 const [ticket,setTicket]=useState('');
 const [history,setHistory]=useState(null);
 const [historyError,setHistoryError]=useState('');
 const [loadingHistory,setLoadingHistory]=useState(false);
 async function send(e){e.preventDefault();if(sending)return;
  setError('');setSending(true);
  try{const id=await onSubmit({reply_email:email,category,details,honey:website});setTicket(id);setDetails('');}
  catch(err){setError(err.message||'Unable to send your request.');}
  finally{setSending(false)}
 }
 async function loadHistory(){if(loadingHistory)return;setLoadingHistory(true);setHistoryError('');
  try{setHistory(await onLoadHistory())}catch(e){setHistoryError(e.message||'Could not load your requests')}
  finally{setLoadingHistory(false)}
 }
 return <div className="modal-content ln-support">
  {ticket?<div className="ln-support-success" role="status"><CheckCircle size={36}/><h3>Support request received</h3><p>Your ticket reference is <strong>{ticket.slice(0,8).toUpperCase()}</strong>.</p><p>We'll use <strong>{email}</strong> to follow up. Please check your inbox, including spam.</p><button type="button" className="secondary-btn" onClick={()=>setTicket('')}>Report another issue</button></div>:
  <form className="ln-support-form" onSubmit={send}>
   <p>Tell us what's happening. You can request help even if you can't sign in.</p>
   <span className="field-label" id="ln-support-choose">What do you need help with?</span>
   <div className="ln-support-choices" role="group" aria-labelledby="ln-support-choose">{categories.map(({id,name,Icon})=><button type="button" key={id} aria-pressed={category===id} className={'ln-support-choice '+(category===id?'chosen':'')} onClick={()=>setCategory(id)}><Icon size={20}/><span>{name}</span></button>)}</div>
   <label className="field-label" htmlFor="ln-support-details">Describe the issue</label>
   <textarea id="ln-support-details" className="post-textarea" minLength={10} maxLength={3000} required rows={5} value={details} onChange={e=>setDetails(e.target.value)} placeholder="What happened? What were you trying to do? Include the page or feature involved."/>
   <label className="field-label" htmlFor="ln-support-email">Email address for our reply</label>
   <input id="ln-support-email" type="email" className="text-field" maxLength={254} required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
   <p className="field-hint">We'll only use this address to respond to your request. Don't enter passwords or payment details.</p>
   <div className="ln-support-honeypot" aria-hidden="true"><label htmlFor="ln-support-website">Website</label><input id="ln-support-website" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></div>
   {error&&<p role="alert" className="ln-support-error">{error}</p>}
   <button type="submit" className="primary-btn modal-cta" disabled={sending||details.trim().length<10||!email.trim()}><Send size={17}/>{sending?'Sending…':'Send support request'}</button>
  </form>}
  {isSignedIn&&<div className="ln-support-history"><button type="button" className="outline-btn" onClick={loadHistory} disabled={loadingHistory}><HelpCircle size={17}/>{loadingHistory?'Loading…':'My support requests'}</button>{historyError&&<p role="alert">{historyError}</p>}{history!==null&&<div className="ln-support-history-list">{history.length===0?<p>No requests yet.</p>:history.map(item=><div key={item.id}><strong>{item.category.replaceAll('_',' ')} · {item.status}</strong><small>{new Date(item.created_at).toLocaleDateString()} · #{item.id.slice(0,8).toUpperCase()}</small><p>{item.details}</p></div>)}</div>}</div>}
  <p className="ln-support-direct">Or email <a href="mailto:lockernoise2026@gmail.com?subject=LockerNoise%20Support">lockernoise2026@gmail.com <ExternalLink size={13}/></a></p>
 </div>;
}
