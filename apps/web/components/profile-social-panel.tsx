'use client';

import {useCallback,useEffect,useState} from 'react';
import {Award,BarChart3,ShieldCheck,UserPlus,Users} from 'lucide-react';
import {toast} from 'sonner';
import {apiFetch} from '@/services/api';

type Stats={
 user:{id:string;handle:string;displayName:string;owned:boolean};
 follows:{followers:number;following:number;viewerFollows:boolean};
 battle:{battlesCreated:number;votesCast:number;evidenceBackedArguments:number;highEngagementBattles:number;tournamentVotes:number};
 squad:{savedSquads:number;challengeSubmissions:number;communityVotesReceived:number};
 evidence:{submissions:number;published:number;linkedEvidence:number;underReview:number;verificationMetricSupported:boolean};
 usage:{roles:Array<{role:string;all:number;primary:number;percent:number}>;characters:Array<{characterId:string;count:number}>};
 tracking:{completedAnime:number;totalTracked:number};
 progression:{points:number;rank:{id:string;label:string;minPoints:number};badges:Array<{id:string;name:string;description:string;category:string;icon:string;earnedAt:number}>;dailyCap:number};
};
type Prefs={profileVisibility:'public'|'private';publishBattles:boolean|number;publishSquads:boolean|number;publishEvidence:boolean|number;publishDiscussions:boolean|number;publishTracking:boolean|number};
type EventRow={id:string;eventType:string;spoiler?:boolean;createdAt:number};
async function json<T>(url:string,init?:RequestInit):Promise<T>{const r=await apiFetch(url,init),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error((d as {error?:string}).error||'Request failed.');return d as T;}
const label=(value:string)=>value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

export function ProfileSocialPanel({handle,user}:{handle:string;user:boolean}){
 const [stats,setStats]=useState<Stats|null>(null),[events,setEvents]=useState<EventRow[]>([]),[prefs,setPrefs]=useState<Prefs|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);try{const data=await json<Stats>('/api/profile-stats?handle='+encodeURIComponent(handle));setStats(data);const activity=await json<{events:EventRow[]}>('/api/social?mode=activity&handle='+encodeURIComponent(handle)+'&limit=20');setEvents(activity.events);if(data.user.owned){const p=await json<{preferences:Prefs}>('/api/social?mode=preferences');setPrefs(p.preferences);}}catch(error){toast.error((error as Error).message);}finally{setLoading(false);}},[handle]);
 useEffect(()=>{void load();},[load]);
 async function social(action:'follow'|'unfollow'){if(!stats)return;setBusy(true);try{await json('/api/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,targetUserId:stats.user.id})});await load();}catch(error){toast.error((error as Error).message);}finally{setBusy(false);}}
 async function savePrefs(){if(!prefs)return;setBusy(true);try{await json('/api/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'preferences',profileVisibility:prefs.profileVisibility,publishBattles:Boolean(prefs.publishBattles),publishSquads:Boolean(prefs.publishSquads),publishEvidence:Boolean(prefs.publishEvidence),publishDiscussions:Boolean(prefs.publishDiscussions),publishTracking:Boolean(prefs.publishTracking)})});toast.success('Privacy preferences saved.');await load();}catch(error){toast.error((error as Error).message);}finally{setBusy(false);}}
 if(loading)return <section className="ac-surface profile-social-panel"><p>Loading social profile statistics...</p></section>;
 if(!stats)return null;
 return <div className="profile-social-stack">
  <section className="ac-surface profile-rank-panel"><div><span className="ac-eyebrow">PLATFORM RANK</span><h2>{stats.progression.rank.label}</h2><p>{stats.progression.points} reputation points · daily earning cap {stats.progression.dailyCap}</p></div>{!stats.user.owned&&user&&<button type="button" className={stats.follows.viewerFollows?'ac-button-subtle':'ac-button'} disabled={busy} onClick={()=>void social(stats.follows.viewerFollows?'unfollow':'follow')}>{stats.follows.viewerFollows?<Users size={16}/>:<UserPlus size={16}/>} {stats.follows.viewerFollows?'Following':'Follow'}</button>}</section>
  <div className="ac-profile-stat-grid"><div className="ac-surface"><strong>{stats.follows.followers}</strong><span>Followers</span></div><div className="ac-surface"><strong>{stats.follows.following}</strong><span>Following</span></div><div className="ac-surface"><strong>{stats.battle.battlesCreated}</strong><span>Battles created</span></div><div className="ac-surface"><strong>{stats.squad.challengeSubmissions}</strong><span>Challenge squads</span></div><div className="ac-surface"><strong>{stats.evidence.submissions}</strong><span>Evidence records</span></div><div className="ac-surface"><strong>{stats.tracking.completedAnime}</strong><span>Anime completed</span></div></div>
  <div className="ac-profile-sections"><section className="ac-surface"><span className="ac-eyebrow"><BarChart3 size={14}/> CONTRIBUTION STATS</span><h2>Battle &amp; squad activity</h2><p>{stats.battle.votesCast} battle votes · {stats.battle.evidenceBackedArguments} evidence-backed arguments · {stats.battle.highEngagementBattles} high-engagement battles</p><p>{stats.squad.savedSquads} saved squads · {stats.squad.communityVotesReceived} community votes received</p><h3>Most-used roles</h3><div className="ac-tag-row">{stats.usage.roles.slice(0,8).map(role=><span key={role.role}>{label(role.role)} {role.percent}%</span>)}</div></section>
  <section className="ac-surface"><span className="ac-eyebrow"><Award size={14}/> BADGES</span><h2>Achievements</h2>{stats.progression.badges.length?<div className="profile-badge-grid">{stats.progression.badges.map(b=><article key={b.id}><strong>{b.name}</strong><p>{b.description}</p><small>{new Date(b.earnedAt).toLocaleDateString()}</small></article>)}</div>:<p>No badges earned yet.</p>}<small>Evidence verification is not counted because the current evidence model does not yet persist an authoritative verification state.</small></section></div>
  <section className="ac-surface"><span className="ac-eyebrow">RECENT PUBLIC ACTIVITY</span><h2>Activity</h2>{events.length?events.map(event=><div className="profile-activity-row" key={event.id}><span>{event.spoiler?'Spoiler-sensitive activity hidden':label(event.eventType)}</span><time>{new Date(event.createdAt).toLocaleString()}</time></div>):<p>No visible activity yet.</p>}</section>
  {stats.user.owned&&prefs&&<section className="ac-surface profile-privacy"><span className="ac-eyebrow"><ShieldCheck size={14}/> PRIVACY</span><h2>Activity visibility</h2><label>Profile visibility <select value={prefs.profileVisibility} onChange={e=>setPrefs({...prefs,profileVisibility:e.target.value as 'public'|'private'})}><option value="public">Public</option><option value="private">Private</option></select></label>{([['publishBattles','Battle activity'],['publishSquads','Squad activity'],['publishEvidence','Evidence activity'],['publishDiscussions','Discussion activity'],['publishTracking','Anime/manga completion activity']] as const).map(([key,name])=><label className="profile-privacy-toggle" key={key}><input type="checkbox" checked={Boolean(prefs[key])} onChange={e=>setPrefs({...prefs,[key]:e.target.checked})}/>{name}</label>)}<button type="button" className="ac-button" disabled={busy} onClick={()=>void savePrefs()}>Save privacy settings</button></section>}
 </div>;
}
