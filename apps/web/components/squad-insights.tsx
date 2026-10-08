import {ROLE_DEFINITIONS,analyzeSquadComposition,type VersionRole,type StrategicTrait,type StrategicMember} from '@anime/domain/squad-synergy';

export function RoleBadges({roles,historical=false}:{roles:VersionRole[]|null|undefined;historical?:boolean}){
 if(roles==null)return <small className="squad-roles-unavailable">{historical?'Roles not recorded for this historical build':'Version roles not curated'}</small>;
 if(!roles.length)return <small className="squad-roles-unavailable">Roles not yet curated</small>;
 const sorted=[...roles].sort((a,b)=>(a.priority==='primary'?0:1)-(b.priority==='primary'?0:1));
 return <div className="squad-role-badges" aria-label="Version combat roles">{sorted.map(({role,priority,notes})=><abbr key={role} className={'squad-role-badge '+(priority==='secondary'?'secondary':'')} title={ROLE_DEFINITIONS[role].description+(notes?' '+notes:'')}>{ROLE_DEFINITIONS[role].label}</abbr>)}</div>;
}

/** Native disclosure remains usable on touch screens and via keyboard. */
export function RoleGlossary(){
 return <details className="squad-role-glossary"><summary>What do combat roles mean?</summary><dl>{Object.entries(ROLE_DEFINITIONS).map(([id,item])=><div key={id}><dt>{item.label}</dt><dd>{item.description}</dd></div>)}</dl></details>;
}

export function SquadInsights({members,legacyCount=0}:{members:StrategicMember[];legacyCount?:number}){
 if(!members.length)return legacyCount?<p className="squad-roles-unavailable">{legacyCount} historical member(s) have no recorded combat roles. No current roles have been substituted.</p>:null;
 const insight=analyzeSquadComposition(members);
 return <section className="squad-tactical-insights" aria-label="Squad tactical composition">
  <h3>Squad insights <small>{insight.roleDiversity} roles covered</small></h3>
  <div className="squad-insights-columns">
   <div><h4>Team composition</h4>{insight.roleCounts.length?insight.roleCounts.map(item=><div className="squad-coverage-row" key={item.role}><span>{ROLE_DEFINITIONS[item.role].label}</span><b>{item.count}</b></div>):<small>No curated roles in this build.</small>}
    <h4>Team coverage</h4>{insight.coverage.map(item=><div className="squad-coverage-row" key={item.label}><span>{item.label}</span><b>{item.level}</b></div>)}</div>
   <div><h4>Potential synergies</h4>{insight.synergies.length?insight.synergies.map(pair=><p className="squad-synergy-item" key={pair.id}><strong>{pair.label}</strong> · {pair.fighters.join(' + ')}<small>{pair.description}</small></p>):<small>No curated cross-fighter combinations yet.</small>}
    {insight.strengths.length>0&&<><h4>Strengths</h4><ul>{insight.strengths.map(value=><li key={value}>{value}</li>)}</ul></>}
    {insight.gaps.length>0&&<><h4>Potential gaps</h4><ul>{insight.gaps.map(value=><li key={value}>{value}</li>)}</ul></>}
    {insight.concentrations.length>0&&<><h4>Role concentration</h4><p>{insight.concentrations.map(x=>`${ROLE_DEFINITIONS[x.role].label}: ${x.count}`).join(' · ')}</p></>}
   </div>
  </div>
  {legacyCount>0&&<small className="squad-roles-unavailable">Analysis excludes {legacyCount} historical member(s) without snapshots.</small>}
  <small className="squad-insights-disclaimer">Qualitative coverage, not a win prediction. Support your strategy with version-specific feats.</small>
 </section>;
}

export function SubmissionInsights({members}:{members:{versionId:string;characterName:string;roles:VersionRole[]|null;traits:StrategicTrait[]|null}[]}){
 return <SquadInsights members={members.filter(m=>m.roles!==null).map(m=>({versionId:m.versionId,characterName:m.characterName,roles:m.roles||[],traits:m.traits||[]}))} legacyCount={members.filter(m=>m.roles===null).length}/>;
}
