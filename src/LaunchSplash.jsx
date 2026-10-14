import React from 'react';

// Website and Capacitor Android use this same in-app animation.
// Native Android shows the matching static launch asset until the WebView mounts.
const BURSTS=Array.from({length:16},(_,i)=>({angle:i*22.5,dist:120+(i%4)*23,delay:(i%3)*42}));

export default function LaunchSplash({waitingForAuth=false}){
 return <main className="ln-launch" role="status" aria-live="polite" aria-label="LockerNoise is starting">
  <div className="ln-launch-halo" aria-hidden="true"/>
  <div className="ln-launch-center">
   <div className="ln-launch-stage" aria-hidden="true">
    <div className="ln-launch-spin">
     <img src="/brand/splash-shield.png" className="ln-launch-emblem" alt="" draggable="false"/>
    </div>
    <div className="ln-launch-ring ln-launch-ring-a"/>
    <div className="ln-launch-ring ln-launch-ring-b"/>
    <div className="ln-launch-flash"/>
    {BURSTS.map((spark,i)=><i key={i} className="ln-launch-spark" style={{'--direction':`${spark.angle}deg`,'--distance':`${spark.dist}px`,'--delay':`${spark.delay}ms`}}/>)}
   </div>
   <img className="ln-launch-title" src="/brand/splash-wordmark.png" alt="LockerNoise" draggable="false"/>
   <p className="ln-launch-tagline">THE HOME OF FOOTBALL FANS</p>
   <div className="ln-launch-loading"><span className="ln-launch-loading-line"/></div>
   {waitingForAuth&&<p className="ln-launch-wait">Connecting to your huddle…</p>}
  </div>
  <span className="ln-launch-accessible">Loading LockerNoise. Checking your sign-in securely.</span>
 </main>
}
