import {database} from '@/db/raw';
import {fighters} from '@/lib/catalog';
import {abilitiesForVersion,characterVersions,versionById,versionsForCharacter} from '@/lib/characters';

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'public, max-age=30'}});

function publicVersion(version:ReturnType<typeof versionById>){
 if(!version)return null;
 const character=fighters.find(f=>f.id===version.characterId);
 if(!character)return null;
 return {
  character:{id:character.id,name:character.name,series:character.series},
  version:{
   id:version.id,
   characterId:version.characterId,
   name:version.name,
   shortName:version.shortName||null,
   aliases:version.aliases,
   description:version.description,
   era:version.era||null,
   arc:version.arc||null,
   sortOrder:version.sortOrder,
   canonical:version.canonical,
   sourceEndpoint:version.sourceEndpoint||null,
   parentVersionId:version.parentVersionId||null
  },
  abilities:abilitiesForVersion(version.id).map(({ability,link})=>({
   id:ability.id,name:ability.name,description:ability.description,category:ability.category,status:link.status,notes:link.notes||null
  }))
 };
}

export async function GET(req:Request){try{
 const url=new URL(req.url),db=database();
 const characterId=(url.searchParams.get('character')||'').trim();
 const versionId=(url.searchParams.get('version')||'').trim();
 const q=(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,120);

 if(versionId){
  const version=versionById(versionId);
  const data=publicVersion(version);
  if(!version||!data)return json({error:'Character version not found.'},404);
  const counts=await db.prepare('SELECT category,COUNT(*) AS n FROM evidence_records WHERE deleted=0 AND version_id=? GROUP BY category').bind(version.id).all<any>();
  return json({...data,featCounts:Object.fromEntries(counts.results.map(row=>[row.category,Number(row.n||0)])),featTotal:counts.results.reduce((n,row)=>n+Number(row.n||0),0)});
 }

 if(characterId){
  const character=fighters.find(f=>f.id===characterId);
  if(!character)return json({error:'Character not found.'},404);
  const versions=versionsForCharacter(characterId);
  const counts=versions.length?(await db.prepare(`SELECT version_id AS versionId,category,COUNT(*) AS n FROM evidence_records WHERE deleted=0 AND version_id IN (${versions.map(()=>'?').join(',')}) GROUP BY version_id,category`).bind(...versions.map(v=>v.id)).all<any>()).results:[];
  const byVersion=new Map<string,Record<string,number>>();
  for(const row of counts){const current=byVersion.get(row.versionId)||{};current[row.category]=Number(row.n||0);byVersion.set(row.versionId,current);}
  return json({
   character:{id:character.id,name:character.name,series:character.series,role:character.role,description:character.description,color:character.color,tags:character.tags,sourceLabel:character.sourceLabel,sourceUrl:character.sourceUrl},
   versions:versions.map(version=>{const publicData=publicVersion(version)!;const featCounts=byVersion.get(version.id)||{};return {...publicData.version,abilities:publicData.abilities,abilityCount:publicData.abilities.length,featCounts,featTotal:Object.values(featCounts).reduce((n,v)=>n+v,0)};})
  });
 }

 const matches=characterVersions.filter(version=>{
  if(!q)return true;
  const character=fighters.find(f=>f.id===version.characterId);
  const abilityText=abilitiesForVersion(version.id).map(x=>x.ability.name).join(' ');
  return [character?.name||'',character?.series||'',version.name,version.shortName||'',version.arc||'',version.era||'',...version.aliases,abilityText].join(' ').toLowerCase().includes(q);
 }).slice(0,50);
 return json({versions:matches.map(version=>publicVersion(version)).filter(Boolean)});
 }catch(e){console.error('Character version load failed',e);return json({error:'Could not load character versions.'},503);}}
