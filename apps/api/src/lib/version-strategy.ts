import type {DatabaseClient, PreparedStatement} from '@/db/raw';
import {COMBAT_ROLES,STRATEGIC_TRAITS,isCombatRole,isStrategicTrait,type VersionRole,type StrategicTrait,type VersionStrategy} from '@anime/domain/squad-synergy';
type RoleRow={versionId:string;role:string;priority:string;notes:string};
type TraitRow={versionId:string;trait:string};
export async function loadVersionStrategies(db:DatabaseClient,ids:string[]):Promise<Map<string,VersionStrategy>>{
 const unique=[...new Set(ids)].filter(Boolean);
 const result=new Map<string,VersionStrategy>(unique.map(id=>[id,{roles:[],traits:[]}]));
 // D1 has a bound-variable limit. Each batch uses two SQL statements instead of one per fighter.
 for(let i=0;i<unique.length;i+=80){
  const batch=unique.slice(i,i+80),marks=batch.map(()=>'?').join(',');
  const [roleResult,traitResult]=await Promise.all([
   db.prepare(`SELECT vr.version_id AS versionId,vr.role,vr.priority,vr.notes FROM version_combat_roles vr JOIN character_versions v ON v.id=vr.version_id WHERE vr.version_id IN (${marks}) AND v.canonical=1 ORDER BY vr.version_id,CASE vr.priority WHEN 'primary' THEN 0 ELSE 1 END,vr.role`).bind(...batch).all<RoleRow>(),
   db.prepare(`SELECT vt.version_id AS versionId,vt.trait FROM version_strategic_traits vt JOIN character_versions v ON v.id=vt.version_id WHERE vt.version_id IN (${marks}) AND v.canonical=1 ORDER BY vt.version_id,vt.trait`).bind(...batch).all<TraitRow>()
  ]);
  for(const row of roleResult.results){
   if(isCombatRole(row.role)&&(row.priority==='primary'||row.priority==='secondary'))result.get(row.versionId)?.roles.push({role:row.role,priority:row.priority,notes:row.notes||undefined});
  }
  for(const row of traitResult.results){if(isStrategicTrait(row.trait))result.get(row.versionId)?.traits.push(row.trait);}
 }
 return result;
}
// Stable allowlists also protect public snapshots from DB corruption or unsupported future identifiers.
export function parseRoleSnapshot(raw:string|null):VersionRole[]|null{
 if(raw===null)return null;
 try{const x:unknown=JSON.parse(raw);return Array.isArray(x)?x.filter((v):v is VersionRole=>Boolean(v&&typeof v==='object'&&isCombatRole(v.role)&&(v.priority==='primary'||v.priority==='secondary'))):null;}catch{return null;}
}
export function parseTraitSnapshot(raw:string|null):StrategicTrait[]|null{
 if(raw===null)return null;
 try{const x:unknown=JSON.parse(raw);return Array.isArray(x)?x.filter(isStrategicTrait):null;}catch{return null;}
}
export {COMBAT_ROLES,STRATEGIC_TRAITS};
