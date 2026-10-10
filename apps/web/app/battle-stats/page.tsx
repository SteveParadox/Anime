'use client';

import {useEffect,useState} from 'react';
import {apiJson} from '@/services/api';

type FighterRecord={characterId:string;name:string;wins:number;losses:number;draws:number;total:number;winRate:number|null;rank?:number;versions?:Array<{versionId:string;name:string;wins:number;losses:number;draws:number;winRate:number|null}>};
type BattleHighlight={battleId:string;fighterA:string;fighterB:string;versionA:string;versionB:string;outcome:string;votesA:number;votesB:number;votesDraw:number;voteMargin:number|null;controversy:number};
const fmt=(value:number|null)=>value===null?'Unranked':value.toFixed(2)+'%';

export default function BattleStatsPage(){
 const [leaderboard,setLeaderboard]=useState<FighterRecord[]>([]);
 const [highlights,setHighlights]=useState<{closest:BattleHighlight[];landslides:BattleHighlight[];controversial:BattleHighlight[];draws:BattleHighlight[]}|null>(null);
 const [record,setRecord]=useState<FighterRecord|null>(null);
 const [selected,setSelected]=useState('');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false;
  Promise.all([
   apiJson<{leaderboard:FighterRecord[]}>('/api/battle-analytics?mode=leaderboard'),
   apiJson<{closest:BattleHighlight[];landslides:BattleHighlight[];controversial:BattleHighlight[];draws:BattleHighlight[]}>('/api/battle-analytics?mode=highlights')
  ]).then(([a,b])=>{if(!cancelled){setLeaderboard(a.leaderboard);setHighlights(b);}}).catch(e=>{if(!cancelled)setError(String(e.message||e));}).finally(()=>{if(!cancelled)setLoading(false);});
  return ()=>{cancelled=true;};
 },[]);
 async function openRecord(characterId:string){
  setSelected(characterId);setError('');
  try{const r=await apiJson<{record:FighterRecord}>('/api/battle-analytics?mode=record&characterId='+encodeURIComponent(characterId));setRecord(r.record);}
  catch(e){setError((e as Error).message);}
 }
 const sections:[string,BattleHighlight[]][]=[
  ['Closest decided battles',highlights?.closest||[]],
  ['Biggest landslides',highlights?.landslides||[]],
  ['Most controversial voting splits',highlights?.controversial||[]],
  ['Community draws',highlights?.draws||[]]
 ];
 return <main style={{maxWidth:1150,margin:'0 auto',padding:'36px 20px 90px',lineHeight:1.6}}>
  <a href="/" style={{color:'inherit'}}>← Return to Battle Arena</a>
  <header style={{margin:'28px 0'}}>
   <p style={{letterSpacing:2,textTransform:'uppercase',fontSize:12}}>Anime Clash · Battle intelligence</p>
   <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:800}}>Community Battle Records</h1>
   <p>Finalized community verdicts only. Open polls, starter exhibitions, voided results and no-contests do not count as wins. These rankings describe fan votes, not canon power levels.</p>
  </header>
  {error&&<p role="alert" style={{padding:12,border:'1px solid currentColor'}}>{error}</p>}
  {loading?<p role="status">Loading verified records…</p>:<>
   <section aria-labelledby="leaderboard-title">
    <h2 id="leaderboard-title" style={{fontSize:25,fontWeight:700,marginBottom:12}}>Win-rate leaderboard</h2>
    <p>At least three qualifying finalized matchups are needed to rank. Ties are broken by battle count and character ID.</p>
    {leaderboard.length===0?<p>No fighters have enough finalized eligible matchups yet.</p>:
     <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}>
      <thead><tr>{['Rank','Character','Wins','Losses','Draws','Battles','Win rate'].map(x=><th key={x} style={{padding:10,borderBottom:'1px solid currentColor'}}>{x}</th>)}</tr></thead>
      <tbody>{leaderboard.map(row=><tr key={row.characterId} style={{borderBottom:'1px solid #7775'}}>
       <td style={{padding:10}}>{row.rank}</td>
       <td style={{padding:10}}><button onClick={()=>void openRecord(row.characterId)} aria-label={'View battle record for '+row.name} style={{textDecoration:'underline',cursor:'pointer'}}>{row.name}</button></td>
       <td style={{padding:10}}>{row.wins}</td><td style={{padding:10}}>{row.losses}</td><td style={{padding:10}}>{row.draws}</td><td style={{padding:10}}>{row.total}</td><td style={{padding:10}}>{fmt(row.winRate)}</td>
      </tr>)}</tbody>
     </table></div>}
   </section>
   {record&&<section aria-live="polite" style={{padding:20,margin:'24px 0',border:'1px solid #8887',borderRadius:12}}>
    <h2 style={{fontSize:24,fontWeight:700}}>{record.name} · Battle Record</h2>
    <p>{record.wins}W / {record.losses}L / {record.draws}D · {fmt(record.winRate)} win rate</p>
    <h3 style={{fontWeight:600}}>Version-specific results</h3>
    {!record.versions?.length?<p>No finalized version-specific records.</p>:<ul>{record.versions.map(v=><li key={v.versionId}>{v.name}: {v.wins}W / {v.losses}L / {v.draws}D ({fmt(v.winRate)})</li>)}</ul>}
    <button onClick={()=>{setRecord(null);setSelected('');}} aria-label={'Close '+selected+' record'} style={{textDecoration:'underline',marginTop:8}}>Close record</button>
   </section>}
   <section style={{marginTop:36}}>
    <h2 style={{fontSize:25,fontWeight:700}}>Battle highlights</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,440px),1fr))',gap:24,marginTop:16}}>
     {sections.map(([title,rows])=><article key={title} style={{border:'1px solid #8885',padding:18,borderRadius:12}}>
      <h3 style={{fontWeight:700,fontSize:20,marginBottom:10}}>{title}</h3>
      {rows.length===0?<p>No eligible battles in this category yet.</p>:
      <ol style={{paddingLeft:22}}>{rows.slice(0,8).map(row=><li key={row.battleId} style={{marginBottom:12}}>
       <a href={'/?battle='+encodeURIComponent(row.battleId)} style={{textDecoration:'underline'}}>{row.fighterA} vs {row.fighterB}</a>
       <div style={{fontSize:13,opacity:.8}}>{row.versionA} / {row.versionB}</div>
       <div style={{fontSize:13}}>Votes: {row.votesA} · {row.votesB} · Draw {row.votesDraw} | Margin {fmt(row.voteMargin)}</div>
      </li>)}</ol>}
     </article>)}
    </div>
   </section>
  </>}
 </main>;
}
