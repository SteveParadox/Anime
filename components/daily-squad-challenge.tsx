'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import {Check,Copy,Flag,History,Plus,Search,Target,Trophy,X} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {toast} from 'sonner';
import type {SquadChallengeFighter,SquadChallengeRules} from '@/lib/squad-challenge';
import {COMBAT_ROLES,ROLE_DEFINITIONS,roleRequirementProgress,type VersionRole,type StrategicTrait} from '@/lib/squad-synergy';
import {RoleBadges,SquadInsights,SubmissionInsights} from '@/components/squad-insights';

type ChallengeView={
 id:string;
 type:string;
 title:string;
 description:string;
 target:{characterId:string;characterName:string;versionId:string;versionName:string;series:string}|null;
 budget:number;
 minMembers:number;
 maxMembers:number;
 rules:SquadChallengeRules;
 startsAt:number;
 endsAt:number;
 status:'scheduled'|'active'|'closed';
 fighters:SquadChallengeFighter[];
};

type HistoryItem={
 id:string;
 title:string;
 target:{characterId:string;characterName:string;versionId:string;versionName:string;series:string}|null;
 budget:number;
 maxMembers:number;
 startsAt:number;
 endsAt:number;
 status:'scheduled'|'active'|'closed';
};

type SubmissionMember={
 position:number;
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 cost:number;
 roles:VersionRole[]|null;
 traits:StrategicTrait[]|null;
};

type VoteSummary=
 |{hidden:true;total:number}
 |{hidden:false;yes:number;no:number;total:number;yesPercent:number;noPercent:number};

type Submission={
 id:string;
 challengeId:string;
 challenge:{
  id:string;
  title:string;
  target:{characterId:string;characterName:string;versionId:string;versionName:string;series:string}|null;
  budget:number;
  maxMembers:number;
  status:'scheduled'|'active'|'closed';
  startsAt:number;
  endsAt:number;
 };
 owner:{username:string;displayName:string;avatarUrl:string|null};
 owned:boolean;
 name:string;
 strategy:string;
 totalCost:number;
 members:SubmissionMember[];
 locked:boolean;
 editable:boolean;
 created:number;
 updated:number;
 myVote:'yes'|'no'|null;
 rank:number|null;
 votes:VoteSummary;
};

type ChallengeResponse={
 challenge:ChallengeView;
 history:HistoryItem[];
 viewer:{authenticated:boolean;mySubmissionId:string|null;submissionLocked:boolean;submissionRemoved:boolean};
};

function fighterKey(fighter:SquadChallengeFighter){return `${fighter.characterId}:${fighter.versionId}`}

function rulesList(rules:SquadChallengeRules){
 const rows:{label:string;value:string}[]=[];
 if(rules.battleType)rows.push({label:'Battle type',value:rules.battleType.replaceAll('_',' ')});
 if(rules.location)rows.push({label:'Location',value:rules.location.replaceAll('_',' ')});
 if(rules.speed)rows.push({label:'Speed',value:rules.speed.replaceAll('_',' ')});
 if(rules.knowledge)rows.push({label:'Knowledge',value:rules.knowledge.replaceAll('_',' ')});
 if(rules.prepTime)rows.push({label:'Prep',value:rules.prepTime.replaceAll('_',' ')});
 if(typeof rules.transformationsAllowed==='boolean')rows.push({label:'Transformations',value:rules.transformationsAllowed?'Allowed':'Restricted'});
 if(typeof rules.standardEquipment==='boolean')rows.push({label:'Equipment',value:rules.standardEquipment?'Standard':'Custom'});
 return rows;
}

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,init);
 const data=await response.json().catch(()=>({})) as {error?:string}&T;
 if(!response.ok)throw new Error(data.error||'Request failed.');
 return data;
}

export function DailySquadChallengeTeaser({open}:{open:()=>void}){
 const [challenge,setChallenge]=useState<ChallengeView|null>(null);
 useEffect(()=>{void api<ChallengeResponse>('/api/squad-challenges').then(result=>setChallenge(result.challenge)).catch(()=>{})},[]);
 return <section className="challenge-card"><div className="eyebrow"><Trophy size={16}/> DAILY SQUAD CHALLENGE</div><div className="challenge-mark"><Target size={42}/></div><h2>{challenge?.title||'Build under a strict budget'}</h2><p>{challenge?.target?.versionName||'Exact character versions. Server-authoritative costs.'}</p><div className="challenge-stats"><div><strong>{challenge?.budget||100}</strong><small>POINT BUDGET</small></div><div><strong>{challenge?.maxMembers||5}</strong><small>FIGHTERS MAX</small></div></div><button className="primary full" onClick={open}>Build your squad</button></section>;
}

export function DailySquadChallenge({authenticated}:{authenticated:boolean}){
 const [payload,setPayload]=useState<ChallengeResponse|null>(null);
 const [historyId,setHistoryId]=useState('');
 const [feed,setFeed]=useState<Submission[]>([]);
 const [shared,setShared]=useState<Submission|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [sort,setSort]=useState<'top'|'newest'|'most_voted'>('top');
 const [query,setQuery]=useState('');
 const [series,setSeries]=useState('all');
 const [role,setRole]=useState('all');
 const [tag,setTag]=useState('all');
 const [maxCost,setMaxCost]=useState(100);
 const [order,setOrder]=useState<'cost-asc'|'cost-desc'|'name'|'series'>('cost-asc');
 const [selected,setSelected]=useState<SquadChallengeFighter[]>([]);
 const [name,setName]=useState('');
 const [strategy,setStrategy]=useState('');
 const [editingId,setEditingId]=useState<string|null>(null);

 const challenge=payload?.challenge||null;
 const viewer=payload?.viewer||null;
 const totalCost=selected.reduce((sum,item)=>sum+item.cost,0);
 const remaining=Math.max(0,(challenge?.budget||0)-totalCost);
 const overBudget=Boolean(challenge&&totalCost>challenge.budget);
 const active=challenge?.status==='active';

 const load=useCallback(async(id?:string)=>{
  setLoading(true);
  try{
   const suffix=id?`?id=${encodeURIComponent(id)}`:'';
   const next=await api<ChallengeResponse>('/api/squad-challenges'+suffix);
   setPayload(next);
   setHistoryId(next.challenge.id);
   setMaxCost(next.challenge.budget);
   const list=await api<{submissions:Submission[]}>(`/api/squad-submissions?challenge=${encodeURIComponent(next.challenge.id)}&sort=top&limit=30`);
   setSort('top');
   setFeed(list.submissions);
   if(next.viewer.mySubmissionId){
    const mine=await api<{submission:Submission}>(`/api/squad-submissions?id=${encodeURIComponent(next.viewer.mySubmissionId)}`);
    const byVersion=new Map(next.challenge.fighters.map(f=>[f.versionId,f]));
    setSelected(mine.submission.members.map(member=>{
     const current=byVersion.get(member.versionId);
     if(!current)return null;
     return mine.submission.locked?{...current,characterName:member.characterName,versionName:member.versionName,cost:member.cost,roles:member.roles||[],traits:member.traits||[]}:current;
    }).filter((item):item is SquadChallengeFighter=>Boolean(item)));
    setName(mine.submission.name);
    setStrategy(mine.submission.strategy);
    setEditingId(mine.submission.id);
   }else{
    setSelected([]);
    setName('');
    setStrategy('');
    setEditingId(null);
   }
  }catch(error){toast.error((error as Error).message)}
  finally{setLoading(false)}
 },[]);

 useEffect(()=>{
  const id=new URLSearchParams(location.search).get('challengeSquad');
  if(!id){void load();return}
  void api<{submission:Submission}>(`/api/squad-submissions?id=${encodeURIComponent(id)}`)
   .then(async result=>{setShared(result.submission);await load(result.submission.challengeId)})
   .catch(error=>{toast.error((error as Error).message);void load()});
 },[load]);

 const challengeId=challenge?.id||'';
 useEffect(()=>{
  if(!challengeId)return;
  void api<{submissions:Submission[]}>(`/api/squad-submissions?challenge=${encodeURIComponent(challengeId)}&sort=${sort}&limit=30`)
   .then(result=>setFeed(result.submissions))
   .catch(error=>toast.error((error as Error).message));
 },[sort,challengeId]);

 const seriesOptions=useMemo(()=>challenge?[...new Set(challenge.fighters.map(f=>f.series))].sort():[],[challenge]);
 const roleOptions=COMBAT_ROLES;
 const tagOptions=useMemo(()=>challenge?[...new Set(challenge.fighters.flatMap(f=>f.tags))].sort():[],[challenge]);
 const filtered=useMemo(()=>{
  if(!challenge)return [];
  const q=query.trim().toLowerCase();
  const rows=challenge.fighters.filter(f=>{
   const haystack=`${f.characterName} ${f.versionName} ${f.aliases.join(' ')} ${f.series} ${f.roles.map(r=>ROLE_DEFINITIONS[r.role].label).join(' ')} ${f.tags.join(' ')}`.toLowerCase();
   return (!q||haystack.includes(q))&&(series==='all'||f.series===series)&&(role==='all'||f.roles.some(r=>r.role===role))&&(tag==='all'||f.tags.includes(tag))&&f.cost<=maxCost;
  });
  return rows.sort((a,b)=>{
   if(order==='cost-desc')return b.cost-a.cost||a.versionName.localeCompare(b.versionName);
   if(order==='name')return a.characterName.localeCompare(b.characterName)||a.cost-b.cost;
   if(order==='series')return a.series.localeCompare(b.series)||a.characterName.localeCompare(b.characterName);
   return a.cost-b.cost||a.versionName.localeCompare(b.versionName);
  });
 },[challenge,query,series,role,tag,maxCost,order]);

 const toggle=(fighter:SquadChallengeFighter)=>{
  if(!challenge||!active||viewer?.submissionLocked)return;
  const exists=selected.some(item=>item.versionId===fighter.versionId);
  if(exists){setSelected(items=>items.filter(item=>item.versionId!==fighter.versionId));return}
  if(selected.some(item=>item.characterId===fighter.characterId)){toast.error('Only one version of each character may join the squad.');return}
  if(selected.length>=challenge.maxMembers){toast.error(`This challenge allows at most ${challenge.maxMembers} fighters.`);return}
  if(totalCost+fighter.cost>challenge.budget){toast.error('That version does not fit the remaining budget.');return}
  setSelected(items=>[...items,fighter]);
 };

 const submit=async()=>{
  if(!challenge)return;
  if(!authenticated){location.href='/auth?return_to='+encodeURIComponent('/?view=squads');return}
  setBusy(true);
  try{
   const result=await api<{id:string;totalCost:number;updated:boolean}>('/api/squad-submissions',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     action:'submit',
     challengeId:challenge.id,
     name,
     strategy,
     members:selected.map(item=>({characterId:item.characterId,versionId:item.versionId}))
    })
   });
   setEditingId(result.id);
   toast.success(result.updated?'Challenge squad updated.':'Challenge squad submitted.');
   await load(challenge.id);
  }catch(error){toast.error((error as Error).message)}
  finally{setBusy(false)}
 };

 const deleteEntry=async()=>{
  if(!editingId||!challenge||viewer?.submissionLocked)return;
  if(!confirm('Delete this challenge entry? You can submit a new version only while the challenge remains active and before voting begins.'))return;
  setBusy(true);
  try{
   await api('/api/squad-submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',submissionId:editingId})});
   toast.success('Challenge squad deleted.');
   setSelected([]);
   setName('');
   setStrategy('');
   setEditingId(null);
   await load(challenge.id);
  }catch(error){toast.error((error as Error).message)}
  finally{setBusy(false)}
 };

 const vote=async(submission:Submission,verdict:'yes'|'no')=>{
  if(!authenticated){location.href='/auth?return_to='+encodeURIComponent('/?view=squads');return}
  setBusy(true);
  try{
   await api('/api/squad-submissions/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:submission.id,verdict})});
   toast.success('Vote saved.');
   const list=await api<{submissions:Submission[]}>(`/api/squad-submissions?challenge=${encodeURIComponent(submission.challengeId)}&sort=${sort}&limit=30`);
   setFeed(list.submissions);
   if(shared?.id===submission.id){
    const next=await api<{submission:Submission}>(`/api/squad-submissions?id=${encodeURIComponent(submission.id)}`);
    setShared(next.submission);
   }
  }catch(error){toast.error((error as Error).message)}
  finally{setBusy(false)}
 };

 const report=async(submissionId:string)=>{
  const reason=prompt('What should the moderators review?');
  if(!reason||reason.trim().length<5)return;
  try{
   await api('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'report',subjectType:'squad_submission',subjectId:submissionId,reason})});
   toast.success('Report sent to moderators.');
  }catch(error){toast.error((error as Error).message)}
 };

 const share=async(submissionId:string)=>{
  const url=new URL('/',location.origin);
  url.searchParams.set('view','squads');
  url.searchParams.set('challengeSquad',submissionId);
  try{await navigator.clipboard.writeText(url.toString());toast.success('Challenge squad link copied.')}
  catch{history.replaceState(null,'',url);toast.success('Share link placed in the address bar.')}
 };

 if(loading&&!payload)return <section className="panel daily-squad-loading">Loading today’s squad challenge…</section>;
 if(!challenge)return <section className="panel daily-squad-empty"><Target/><h2>No active squad challenge</h2><p>There is no structured challenge available right now.</p></section>;

 const selectedCharacterIds=new Set(selected.map(item=>item.characterId));
 const rules=rulesList(challenge.rules);
 const tacticalMembers=selected.map(f=>({versionId:f.versionId,characterName:f.characterName,roles:f.roles,traits:f.traits}));
 const requirements=roleRequirementProgress(tacticalMembers,challenge.rules.roleRequirements||[]);
 const affordableHealers=selected.some(f=>f.roles.some(r=>r.role==='healer'))?[]:challenge.fighters.filter(f=>f.roles.some(r=>r.role==='healer')&&f.cost<=remaining&&!selectedCharacterIds.has(f.characterId)).slice(0,3);
 const submitReady=active&&!viewer?.submissionLocked&&selected.length>=challenge.minMembers&&selected.length<=challenge.maxMembers&&!overBudget&&requirements.every(r=>r.valid)&&name.trim().length>=3&&strategy.trim().length>=10;

 return <div className="daily-squad-system">
  {shared&&<section className="panel challenge-shared">
   <div className="section-heading"><div><span className="eyebrow">SHARED CHALLENGE SQUAD</span><h2>{shared.name}</h2></div><button className="secondary" onClick={()=>setShared(null)}><X size={15}/>Close</button></div>
   <p className="challenge-owner">{shared.challenge.title} · {shared.challenge.target?.versionName||shared.challenge.target?.characterName||'Open build'}</p>
   <p className="challenge-owner">@{shared.owner.username} · {shared.totalCost}/{shared.challenge.budget} pts</p>
   <div className="submission-members">{shared.members.map(member=><span key={member.versionId}><strong>{member.characterName}</strong><small>{member.versionName} · {member.cost} pts</small><RoleBadges roles={member.roles} historical/></span>)}</div><SubmissionInsights members={shared.members}/>
   <p className="strategy-copy">{shared.strategy}</p>
   <VoteBlock submission={shared} authenticated={authenticated} busy={busy} vote={vote}/>
  </section>}

  <section className="daily-challenge-hero">
   <div>
    <span className="eyebrow">{challenge.status==='active'?'DAILY CHALLENGE':challenge.status.toUpperCase()}</span>
    <h2>{challenge.title}</h2>
    <p>{challenge.description}</p>
    <div className="daily-challenge-meta"><span><b>{challenge.budget}</b> point budget</span><span><b>{challenge.maxMembers}</b> fighters max</span><span>Ends {new Date(challenge.endsAt).toLocaleString()}</span></div>
   </div>
   <Target size={52}/>
  </section>

  <div className="daily-target panel">
   <div><span className="eyebrow">TARGET</span><h2>{challenge.target?.characterName||'Open build'}</h2><strong>{challenge.target?.versionName||'No fixed target'}</strong><small>{challenge.target?.series}</small></div>
   <div className="challenge-rule-grid">{rules.map(item=><span key={item.label}><small>{item.label}</small><b>{item.value}</b></span>)}</div>
   {challenge.rules.notes&&<p>{challenge.rules.notes}</p>}
   {requirements.length>0&&<div className="squad-requirements"><strong>Role requirements</strong>{requirements.map(item=><span key={item.description} className={item.valid?'met':'unmet'}>{item.valid?'✓':'○'} {item.description} · {item.count} matched</span>)}</div>
  </div>

  {challenge.status==='active'?<div className="daily-builder-layout">
   <section>
    <div className="daily-filter-panel panel">
     <label className="daily-search"><Search size={17}/><input aria-label="Search challenge fighters" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search character, version, alias, role…"/></label>
     <div className="daily-filters">
      <label>Series<select value={series} onChange={event=>setSeries(event.target.value)}><option value="all">All series</option>{seriesOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label>Role<select value={role} onChange={event=>setRole(event.target.value)}><option value="all">All roles</option>{roleOptions.map(value=><option key={value} value={value} title={ROLE_DEFINITIONS[value].description}>{ROLE_DEFINITIONS[value].label}</option>)}</select></label>
      <label>Tag<select value={tag} onChange={event=>setTag(event.target.value)}><option value="all">All tags</option>{tagOptions.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label>Max cost<input type="number" min={1} max={challenge.budget} value={maxCost} onChange={event=>setMaxCost(Math.max(1,Math.min(challenge.budget,Number(event.target.value)||challenge.budget)))}/></label>
      <label>Sort<select value={order} onChange={event=>setOrder(event.target.value as typeof order)}><option value="cost-asc">Cost: low → high</option><option value="cost-desc">Cost: high → low</option><option value="name">Name</option><option value="series">Series</option></select></label>
     </div>
    </div>
    <div className="daily-fighter-grid">
     {filtered.map(fighter=>{
      const selectedVersion=selected.some(item=>item.versionId===fighter.versionId);
      const characterAlreadySelected=selectedCharacterIds.has(fighter.characterId)&&!selectedVersion;
      const unaffordable=!selectedVersion&&fighter.cost>remaining;
      const full=!selectedVersion&&selected.length>=challenge.maxMembers;
      const disabled=Boolean(viewer?.submissionLocked||characterAlreadySelected||unaffordable||full);
      return <article className={'daily-fighter-card '+(selectedVersion?'selected':'')} key={fighterKey(fighter)}>
       <div className="daily-fighter-head"><div><strong>{fighter.characterName}</strong><small>{fighter.series}</small></div><b>{fighter.cost} pts</b></div>
       <h3>{fighter.versionName}</h3><RoleBadges roles={fighter.roles}/>
       {fighter.keyAbilities.length>0&&<p>{fighter.keyAbilities.map(item=>item.name).join(' · ')}</p>}
       <button type="button" className={selectedVersion?'secondary':'primary'} disabled={disabled} onClick={()=>toggle(fighter)} aria-label={selectedVersion?`Remove ${fighter.versionName}`:`Add ${fighter.versionName}`}>
        {selectedVersion?<><Check size={15}/>Selected</>:unaffordable?'Not enough budget':characterAlreadySelected?'Character already selected':<><Plus size={15}/>Add</>}
       </button>
      </article>
     })}
     {!filtered.length&&<div className="empty-state">No fighters match these filters.</div>}
    </div>
   </section>

   <aside className="panel daily-squad-summary">
    <div className="section-heading"><h2>Your squad</h2><span>{selected.length} / {challenge.maxMembers}</span></div>
    <div className={'daily-budget '+(totalCost===challenge.budget?'exact':'')}><span>Budget</span><strong>{totalCost} <small>/ {challenge.budget} pts</small></strong></div>
    <Progress value={Math.min(100,totalCost/challenge.budget*100)}/>
    <p className="remaining-budget">{remaining} point{remaining===1?'':'s'} remaining</p>
    <div className="daily-selected-list">
     {selected.map(item=><div key={item.versionId}><div><strong>{item.characterName}</strong><small>{item.versionName} · {item.cost} pts</small><RoleBadges roles={item.roles}/></div><button type="button" onClick={()=>toggle(item)} aria-label={`Remove ${item.versionName}`} disabled={Boolean(viewer?.submissionLocked)}><X size={15}/></button></div>)}
     {!selected.length&&<div className="empty-squad">Choose 1–{challenge.maxMembers} fighters. You do not have to fill every slot.</div>}
    </div>
    <SquadInsights members={tacticalMembers}/>
     {affordableHealers.length>0&&<div className="squad-affordable-tip"><b>Affordable healers</b><p>{affordableHealers.map(f=>`${f.characterName} · ${f.cost} pts`).join(', ')}</p><button className="secondary" type="button" onClick={()=>{setRole('healer');setMaxCost(Math.max(1,remaining));}}>Browse affordable healers</button></div>}
     <label>Squad name<input value={name} maxLength={60} onChange={event=>setName(event.target.value)} placeholder="The Counter Squad" disabled={Boolean(viewer?.submissionLocked)}/><small>{name.trim().length}/60</small></label>
    <label>Explain your strategy<textarea value={strategy} minLength={10} maxLength={1500} onChange={event=>setStrategy(event.target.value)} placeholder="Explain how each version's roles, abilities, and feats work together…" disabled={Boolean(viewer?.submissionLocked)}/><small>{strategy.length}/1500</small></label>
    <div className="submission-preview"><small>SUBMISSION PREVIEW</small>{selected.map(item=><span key={item.versionId}>{item.characterName}<b>{item.cost}</b></span>)}<span className="submission-total">TOTAL<b>{totalCost} / {challenge.budget}</b></span>{strategy.trim()&&<p>{strategy.trim()}</p>}</div>
    {viewer?.submissionRemoved?<p className="locked-entry">This challenge entry was removed by moderation and cannot be resubmitted.</p>:viewer?.submissionLocked&&<p className="locked-entry">This entry is locked because community voting has started.</p>}
    <button className="primary full" disabled={busy||!submitReady} onClick={submit}>{editingId?'Update challenge squad':'Submit squad'}</button>
    {editingId&&active&&!viewer?.submissionLocked&&<button className="secondary full" disabled={busy} onClick={deleteEntry}>Delete challenge entry</button>}
    {!authenticated&&<small>Sign in to submit. Browsing remains public.</small>}
   </aside>
  </div>:<div className="closed-challenge-note panel">This challenge is closed. Historical squads and community results remain readable.</div>}

  <section className="daily-submissions">
   <div className="section-heading"><div><span className="eyebrow">COMMUNITY BUILDS</span><h2>{challenge.status==='active'?'Top squads':'Final squads'}</h2></div><div className="feed-sort"><button className={sort==='top'?'selected':''} onClick={()=>setSort('top')}>Top</button><button className={sort==='newest'?'selected':''} onClick={()=>setSort('newest')}>Newest</button><button className={sort==='most_voted'?'selected':''} onClick={()=>setSort('most_voted')}>Most voted</button></div></div>
   <div className="daily-submission-grid">{feed.map(submission=><SubmissionCard key={submission.id} submission={submission} authenticated={authenticated} busy={busy} vote={vote} share={share} report={report}/>)}
   {!feed.length&&<div className="empty-state">No squads submitted yet. Build the first challenge team.</div>}</div>
  </section>

  <section className="challenge-history panel">
   <div className="section-heading"><div><span className="eyebrow">ARCHIVE</span><h2>Challenge history</h2></div><History size={20}/></div>
   <div className="history-chips">{payload?.history.map(item=><button key={item.id} className={historyId===item.id?'selected':''} onClick={()=>void load(item.id)}><strong>{item.title}</strong><small>{new Date(item.startsAt).toLocaleDateString()} · {item.status}</small></button>)}</div>
  </section>
 </div>;
}

function SubmissionCard({submission,authenticated,busy,vote,share,report}:{submission:Submission;authenticated:boolean;busy:boolean;vote:(submission:Submission,verdict:'yes'|'no')=>Promise<void>;share:(id:string)=>Promise<void>;report:(id:string)=>Promise<void>}){
 return <article className="panel daily-submission-card">
  <div className="submission-card-head"><div>{submission.rank&&<span className="rank"><Trophy size={13}/>#{submission.rank}</span>}<h3>{submission.name}</h3><small>@{submission.owner.username}</small></div><strong>{submission.totalCost}/{submission.challenge.budget}</strong></div>
  <div className="submission-members">{submission.members.map(member=><span key={member.versionId}><strong>{member.characterName}</strong><small>{member.versionName} · {member.cost} pts</small><RoleBadges roles={member.roles} historical/></span>)}</div><SubmissionInsights members={submission.members}/>
  <p className="strategy-copy">{submission.strategy}</p>
  <VoteBlock submission={submission} authenticated={authenticated} busy={busy} vote={vote}/>
  <div className="submission-actions"><button onClick={()=>share(submission.id)}><Copy size={13}/>Share</button>{!submission.owned&&<button onClick={()=>report(submission.id)}><Flag size={13}/>Report</button>}</div>
 </article>;
}

function VoteBlock({submission,authenticated,busy,vote}:{submission:Submission;authenticated:boolean;busy:boolean;vote:(submission:Submission,verdict:'yes'|'no')=>Promise<void>}){
 const verdictPrompt=submission.challenge.target?`Can this squad defeat ${submission.challenge.target.characterName}?`:'Does this squad satisfy the challenge?';
 return <div className="community-squad-vote">
  <strong>{verdictPrompt}</strong>
  {!submission.owned&&submission.challenge.status==='active'&&<div className="vote-buttons"><button disabled={busy} className={submission.myVote==='yes'?'selected':''} onClick={()=>void vote(submission,'yes')}>YES</button><button disabled={busy} className={submission.myVote==='no'?'selected':''} onClick={()=>void vote(submission,'no')}>NO</button></div>}
  {submission.owned&&submission.challenge.status==='active'&&<small>You cannot vote on your own entry.</small>}
  {submission.votes.hidden?<p className="hidden-results">{submission.votes.total} vote{submission.votes.total===1?'':'s'} · results unlock after you vote.</p>:<div className="vote-results"><span>YES <b>{submission.votes.yesPercent}%</b></span><Progress value={submission.votes.yesPercent}/><span>NO <b>{submission.votes.noPercent}%</b></span><small>{submission.votes.total} total vote{submission.votes.total===1?'':'s'}</small></div>}
  {!authenticated&&!submission.owned&&submission.challenge.status==='active'&&<small>Sign in to vote.</small>}
 </div>;
}
