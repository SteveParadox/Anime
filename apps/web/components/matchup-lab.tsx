'use client';

import {useId,useMemo,useState,type CSSProperties} from 'react';
import {ArrowRight,ChevronDown,Dices,ShieldCheck,Swords} from 'lucide-react';
import {fighters,type Character} from '@anime/domain/catalog';
import {versionsForCharacter} from '@anime/domain/characters';

type Side='A'|'B';
type MatchupLabProps={onCreateMatchup:(fighterAId:string,fighterBId:string)=>void};
type FighterSlotProps={
 side:Side;
 fighter:Character|undefined;
 selectedId:string;
 otherId:string;
 onSelect:(id:string)=>void;
};

function FighterSlot({side,fighter,selectedId,otherId,onSelect}:FighterSlotProps){
 const selectId=useId();
 const versionCount=fighter?versionsForCharacter(fighter.id).length:0;
 const initials=fighter?fighter.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase():'?';
 const style={'--matchup-accent':fighter?.color||(side==='A'?'#b497e6':'#d6a58a')} as CSSProperties;

 return <article className={`matchup-contender matchup-contender--${side.toLowerCase()}${fighter?' has-fighter':''}`} style={style}>
  <div className="matchup-contender-top">
   <span className="matchup-contender-position"><span className="matchup-contender-number">0{side==='A'?'1':'2'}</span>{side==='A'?'CHALLENGER':'OPPONENT'}</span>
   <span className="matchup-contender-slot" aria-hidden="true">{side}</span>
  </div>
  <div className="matchup-contender-hero">
   <div className="matchup-contender-crest" aria-hidden="true"><span>{initials}</span></div>
   <div className="matchup-contender-identity">
    <span className="matchup-contender-eyebrow">{fighter?'READY TO COMPARE':'AWAITING SELECTION'}</span>
    <h3>{fighter?.name||`Choose fighter ${side}`}</h3>
    <p>{fighter?.series||'Select a character from the roster'}</p>
   </div>
  </div>
  <dl className="matchup-contender-facts">
   <div><dt>Combat role</dt><dd>{fighter?.role||'—'}</dd></div>
   <div><dt>Squad cost</dt><dd>{fighter?`${fighter.cost} pts`:'—'}</dd></div>
   <div><dt>Versions</dt><dd>{fighter?versionCount:'—'}</dd></div>
  </dl>
  <div className="matchup-contender-picker">
   <label htmlFor={selectId}>{side==='A'?'Select challenger':'Select opponent'}</label>
   <div className="matchup-contender-select">
    <select id={selectId} aria-label={`Comparison fighter ${side}`} value={selectedId} onChange={event=>onSelect(event.target.value)}>
     <option value="">Choose a fighter</option>
     {fighters.map(candidate=><option key={candidate.id} value={candidate.id} disabled={candidate.id===otherId}>{candidate.name} · {candidate.series}</option>)}
    </select>
    <ChevronDown size={17} aria-hidden="true"/>
   </div>
  </div>
 </article>;
}

/** Presentation-only matchup preview. Exact version and rules are selected in the existing battle builder. */
export function MatchupLab({onCreateMatchup}:MatchupLabProps){
 const [fighterAId,setFighterAId]=useState('');
 const [fighterBId,setFighterBId]=useState('');
 const fighterLookup=useMemo(()=>new Map(fighters.map(fighter=>[fighter.id,fighter])),[]);
 const fighterA=fighterLookup.get(fighterAId),fighterB=fighterLookup.get(fighterBId);
 const ready=Boolean(fighterA&&fighterB&&fighterA.id!==fighterB.id);

 function surprise(){
  if(fighters.length<2)return;
  const indexA=Math.floor(Math.random()*fighters.length);
  const offset=1+Math.floor(Math.random()*(fighters.length-1));
  const indexB=(indexA+offset)%fighters.length;
  setFighterAId(fighters[indexA].id);
  setFighterBId(fighters[indexB].id);
 }

 return <section className="matchup-lab" aria-labelledby="matchup-lab-heading">
  <header className="matchup-lab-header">
   <div className="matchup-lab-intro">
    <span className="matchup-lab-kicker"><Swords size={14} aria-hidden="true"/>MATCHUP LAB <span aria-hidden="true">/</span> THE SHOWDOWN</span>
    <h2 id="matchup-lab-heading">Who takes the win<span>?</span></h2>
    <p>Bring two anime fighters face to face. Choose your lineup, then set the exact versions and battle conditions.</p>
   </div>
   <button type="button" className="matchup-lab-random" onClick={surprise} disabled={fighters.length<2}><Dices size={18} aria-hidden="true"/>Surprise matchup</button>
  </header>

  <div className="matchup-lab-stage">
   <FighterSlot side="A" fighter={fighterA} selectedId={fighterAId} otherId={fighterBId} onSelect={setFighterAId}/>
   <div className="matchup-lab-versus" aria-hidden="true"><span className="matchup-lab-versus-line"/><span className="matchup-lab-versus-emblem">VS</span><span className="matchup-lab-versus-line"/></div>
   <FighterSlot side="B" fighter={fighterB} selectedId={fighterBId} otherId={fighterAId} onSelect={setFighterBId}/>
  </div>

  <footer className="matchup-lab-footer">
   <div className="matchup-lab-next">
    <span className={`matchup-lab-step${ready?' is-ready':''}`}>{ready?<ShieldCheck size={18} aria-hidden="true"/>:<span aria-hidden="true">01</span>}</span>
    <div><strong>{ready?'Both fighters selected':'Pick two different fighters'}</strong><small>{ready?'Next: lock versions, rules and victory conditions':'The arena is waiting for its contenders'}</small></div>
   </div>
   <button type="button" className="matchup-lab-create" disabled={!ready} onClick={()=>{if(ready)onCreateMatchup(fighterA!.id,fighterB!.id);}}>Create this matchup <ArrowRight size={18} aria-hidden="true"/></button>
  </footer>
  <p className="matchup-lab-disclaimer"><ShieldCheck size={14} aria-hidden="true"/>The attributes shown are catalog details, not power rankings or win predictions. Version-specific abilities are locked in the next step.</p>
 </section>;
}
