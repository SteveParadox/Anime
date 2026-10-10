'use client';

import {useEffect,useState} from 'react';
import {apiJson} from '@/services/api';

type VersionRow={versionId:string;name:string;wins:number;losses:number;draws:number;winRate:number|null};
type RecordRow={wins:number;losses:number;draws:number;total:number;winRate:number|null;versions:VersionRow[]};
type Opponent={opponentId:string;name:string;matchups:number;comments:number;participants:number};
type BattleSnapshot={battleId:string;status:string;outcome:string;fighterA:string;fighterB:string;votesA:number;votesB:number;votesDraw:number};
type BattleRecommendation={battle:{id:string;a:string;b:string};reason:string};

const pct=(n:number|null)=>n===null?'Not ranked':n.toFixed(2)+'%';

export function CharacterBattleRecord({characterId}:{characterId:string}){
 const [record,setRecord]=useState<RecordRow|null>(null),[opponents,setOpponents]=useState<Opponent[]>([]),[error,setError]=useState('');
 useEffect(()=>{
  if(!characterId)return;
  const controller=new AbortController();
  setRecord(null);
  Promise.all([
   apiJson<{record:RecordRow}>('/api/battle-analytics?mode=record&characterId='+encodeURIComponent(characterId),{signal:controller.signal}),
   apiJson<{opponents:Opponent[]}>('/api/battle-analytics?mode=most-debated&characterId='+encodeURIComponent(characterId),{signal:controller.signal})
  ]).then(([a,b])=>{if(!controller.signal.aborted){setRecord(a.record);setOpponents(b.opponents);setError('');}})
   .catch(e=>{if(!controller.signal.aborted)setError((e as Error).message);});
  return ()=>controller.abort();
 },[characterId]);
 return <section aria-label="Community battle record" style={{padding:'15px 0'}}>
  <h3>Community Battle Record</h3>
  {record?<><p><strong>{record.wins}W / {record.losses}L / {record.draws}D</strong> · {pct(record.winRate)} win rate from {record.total} qualifying verdicts</p>
   {record.versions.length>0&&<details><summary>Records by selected character version</summary><ul>{record.versions.map(v=><li key={v.versionId}>{v.name}: {v.wins}W / {v.losses}L / {v.draws}D ({pct(v.winRate)})</li>)}</ul></details>}
   {opponents.length>0&&<details><summary>Most-debated opponents</summary><ul>{opponents.slice(0,6).map(o=><li key={o.opponentId}>{o.name}: {o.matchups} matchups, {o.comments} comments, {o.participants} participants</li>)}</ul></details>}
  </>:error?<p role="status">Battle statistics unavailable: {error}</p>:<p>Loading official battle record…</p>}
  <a href="/battle-stats" style={{textDecoration:'underline'}}>View Battle Arena leaderboards</a>
 </section>;
}

export function BattleOutcomePanel({battleId,isStarter}:{battleId:string;isStarter:boolean}){
 const [result,setResult]=useState<BattleSnapshot|null>(null),[endsAt,setEndsAt]=useState(0);
 const [recommendations,setRecommendations]=useState<BattleRecommendation[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!battleId||isStarter)return;
  const controller=new AbortController();
  setResult(null);setRecommendations([]);setError('');
  Promise.all([
   apiJson<{result:BattleSnapshot|null;votingEndsAt:number}>('/api/battle-analytics?mode=battle&battleId='+encodeURIComponent(battleId),{signal:controller.signal}),
   apiJson<{recommendations:BattleRecommendation[]}>('/api/battle-analytics?mode=similar&battleId='+encodeURIComponent(battleId),{signal:controller.signal})
  ]).then(([a,b])=>{if(!controller.signal.aborted){setResult(a.result);setEndsAt(Number(a.votingEndsAt));setRecommendations(b.recommendations);}})
   .catch(e=>{if(!controller.signal.aborted)setError((e as Error).message);});
  return ()=>controller.abort();
 },[battleId,isStarter]);
 async function rematch(){
  setBusy(true);setError('');
  try{
   const created=await apiJson<{id:string}>('/api/battle-analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rematch',battleId})});
   window.location.assign('/?battle='+encodeURIComponent(created.id));
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 if(isStarter)return <section><p className="muted">Starter exhibition: voting is not part of official character win/loss records.</p></section>;
 return <section aria-label="Official battle status" style={{margin:'12px 0',padding:12,border:'1px solid #8885',borderRadius:8}}>
  <h3>Official battle status</h3>
  {result?<p>{result.status==='VOIDED'?'Result voided by moderation':result.status==='NO_CONTEST'?'No contest (insufficient qualifying votes)':result.outcome==='draw'?'Finalized community draw':'Finalized community winner: '+(result.outcome==='a'?result.fighterA:result.fighterB)}. Recorded votes: {result.votesA} / {result.votesB} / {result.votesDraw} draw.</p>
  :endsAt?<p>{Date.now()>=endsAt?'Voting closed. Awaiting result finalization.':'Voting closes '+new Date(endsAt).toLocaleString()}</p>:<p>Checking finalization status…</p>}
  {error&&<p role="alert">{error}</p>}
  <button type="button" className="secondary" disabled={busy} onClick={()=>void rematch()}>{busy?'Creating rematch…':'Create rematch'}</button>
  {recommendations.length>0&&<details style={{marginTop:12}}><summary>Related battles</summary><ul>{recommendations.slice(0,6).map(v=><li key={v.battle.id}><a href={'/?battle='+encodeURIComponent(v.battle.id)}>{v.battle.a} vs {v.battle.b}</a> · {v.reason}</li>)}</ul></details>}
 </section>;
}
