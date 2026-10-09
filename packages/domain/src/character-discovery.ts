import type {Character} from './catalog';
import {characterVersionSearchText,versionsForCharacter} from './characters';

export type CharacterBrowseSort='name'|'cost-asc'|'cost-desc'|'versions-desc';
export type CharacterBrowseFilters={query?:string;series?:string;role?:string;sort?:CharacterBrowseSort};

/** Search the curated combat catalog without mutating its canonical order. */
export function filterCharacterCatalog(items:readonly Character[],filters:CharacterBrowseFilters={}):Character[]{
 const query=(filters.query||'').trim().toLocaleLowerCase();
 const series=filters.series||'all',role=filters.role||'all',sort=filters.sort||'name';
 const matches=items.filter(f=>{
  if(series!=='all'&&f.series!==series)return false;
  if(role!=='all'&&f.role!==role)return false;
  if(!query)return true;
  const text=[f.name,f.series,f.role,f.description,...f.tags,characterVersionSearchText(f.id)].join(' ').toLocaleLowerCase();
  return text.includes(query);
 });
 return matches.sort((a,b)=>{
  if(sort==='cost-asc')return a.cost-b.cost||a.name.localeCompare(b.name);
  if(sort==='cost-desc')return b.cost-a.cost||a.name.localeCompare(b.name);
  if(sort==='versions-desc')return versionsForCharacter(b.id).length-versionsForCharacter(a.id).length||a.name.localeCompare(b.name);
  return a.name.localeCompare(b.name);
 });
}
