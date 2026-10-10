import {normalizeProviderStatus,type MediaType,type NormalizedMedia,type MediaProvider} from '@anime/domain/media';

const ANILIST_ENDPOINT='https://graphql.anilist.co';
const JIKAN_ENDPOINT='https://api.jikan.moe/v4';
const MAX_ATTEMPTS=3;

function text(value:unknown){return typeof value==='string'&&value.trim()?value.trim():null;}
function integer(value:unknown){return Number.isInteger(value)?Number(value):null;}
function stringArray(value:unknown){
 return Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'&&Boolean(item.trim())).map(item=>item.trim()):[];
}
function dateFromParts(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const row=value as Record<string,unknown>,year=integer(row.year),month=integer(row.month),day=integer(row.day);
 if(!year)return null;
 return [String(year),month?String(month).padStart(2,'0'):null,day?String(day).padStart(2,'0'):null].filter(Boolean).join('-');
}
function retryAfterMs(response:Response,attempt:number){
 const seconds=Number(response.headers.get('retry-after'));
 if(Number.isFinite(seconds)&&seconds>0)return Math.min(seconds*1000,15_000);
 return Math.min(400*2**attempt,4000);
}
async function sleep(ms:number){await new Promise(resolve=>setTimeout(resolve,ms));}

async function providerFetch(url:string,init:RequestInit,provider:MediaProvider){
 let lastError:unknown;
 for(let attempt=0;attempt<MAX_ATTEMPTS;attempt++){
  try{
   const response=await fetch(url,{...init,signal:AbortSignal.timeout(10_000),headers:{accept:'application/json',...(init.headers||{})}});
   if(response.ok){
    const value:unknown=await response.json();
    return {value,response};
   }
   const retryable=response.status===429||response.status>=500;
   const body=await response.text().catch(()=>response.statusText);
   const error=Object.assign(new Error(`${provider} request failed (${response.status}): ${body.slice(0,300)}`),{status:response.status,retryable});
   if(!retryable||attempt===MAX_ATTEMPTS-1)throw error;
   await sleep(retryAfterMs(response,attempt));
  }catch(error){
   lastError=error;
   const retryable=error instanceof TypeError||Boolean((error as {retryable?:boolean})?.retryable);
   if(!retryable||attempt===MAX_ATTEMPTS-1)throw error;
   await sleep(Math.min(400*2**attempt,4000));
  }
 }
 throw lastError instanceof Error?lastError:new Error(`${provider} request failed.`);
}

const ANILIST_QUERY=`
query AnimeClashMediaSearch($search:String!,$type:MediaType!,$page:Int!,$perPage:Int!){
 Page(page:$page,perPage:$perPage){
  pageInfo{currentPage hasNextPage}
  media(search:$search,type:$type,isAdult:false,sort:SEARCH_MATCH){
   id idMal siteUrl type format status episodes duration chapters volumes seasonYear
   title{romaji english native}
   synonyms description genres tags{name isMediaSpoiler}
   studios(isMain:true){nodes{name}}
   coverImage{extraLarge large}
   bannerImage
   startDate{year month day}
   endDate{year month day}
   updatedAt
  }
 }
}`;

function normalizeAniListMedia(value:unknown,mediaType:MediaType):NormalizedMedia|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const row=value as Record<string,unknown>,id=integer(row.id);
 if(id==null)return null;
 const titleRow=row.title&&typeof row.title==='object'&&!Array.isArray(row.title)?row.title as Record<string,unknown>:{};
 const romaji=text(titleRow.romaji),english=text(titleRow.english),native=text(titleRow.native);
 const canonical=english||romaji||native;
 if(!canonical)return null;
 const tags=Array.isArray(row.tags)?row.tags.flatMap(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))return [];
  const tag=item as Record<string,unknown>;
  return tag.isMediaSpoiler?[]:text(tag.name)?[String(tag.name)]:[];
 }):[];
 const studiosRow=row.studios&&typeof row.studios==='object'&&!Array.isArray(row.studios)?row.studios as Record<string,unknown>:{};
 const studios=Array.isArray(studiosRow.nodes)?studiosRow.nodes.flatMap(item=>item&&typeof item==='object'&&!Array.isArray(item)&&text((item as Record<string,unknown>).name)?[String((item as Record<string,unknown>).name)]:[]):[];
 const cover=row.coverImage&&typeof row.coverImage==='object'&&!Array.isArray(row.coverImage)?row.coverImage as Record<string,unknown>:{};
 return {
  provider:'anilist',mediaType,externalId:String(id),canonicalUrl:text(row.siteUrl),externalIds:[{provider:'anilist',externalId:String(id),canonicalUrl:text(row.siteUrl)},...(integer(row.idMal)!=null?[{provider:'myanimelist' as const,externalId:String(integer(row.idMal)),canonicalUrl:integer(row.idMal)!=null?`https://myanimelist.net/${mediaType==='anime'?'anime':'manga'}/${integer(row.idMal)}`:null}]:[])],titleCanonical:canonical,
  titleEnglish:english,titleRomaji:romaji,titleNative:native,alternativeTitles:stringArray(row.synonyms),
  synopsis:text(row.description),format:text(row.format),status:normalizeProviderStatus(text(row.status)),
  releaseYear:integer(row.seasonYear)||integer((row.startDate as Record<string,unknown>|undefined)?.year),
  startDate:dateFromParts(row.startDate),endDate:dateFromParts(row.endDate),
  itemCount:mediaType==='anime'?integer(row.episodes):integer(row.chapters),
  durationMinutes:mediaType==='anime'?integer(row.duration):null,genres:stringArray(row.genres),tags,studios,
  coverImageUrl:text(cover.extraLarge)||text(cover.large),bannerImageUrl:text(row.bannerImage),officialWebsite:null,
  providerUpdatedAt:integer(row.updatedAt)?Number(row.updatedAt)*1000:null
 };
}

export async function searchAniList(query:string,mediaType:MediaType,page=1,perPage=10){
 const variables={search:query,type:mediaType==='anime'?'ANIME':'MANGA',page,perPage:Math.max(1,Math.min(perPage,25))};
 const {value}=await providerFetch(ANILIST_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:ANILIST_QUERY,variables})},'anilist');
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('AniList returned an invalid response.');
 const payload=value as Record<string,unknown>;
 if(Array.isArray(payload.errors)&&payload.errors.length){
  const first=payload.errors[0] as Record<string,unknown>;
  throw Object.assign(new Error(text(first?.message)||'AniList GraphQL error.'),{status:integer(first?.status)||502,retryable:false});
 }
 const data=payload.data&&typeof payload.data==='object'&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:{};
 const pageRow=data.Page&&typeof data.Page==='object'&&!Array.isArray(data.Page)?data.Page as Record<string,unknown>:{};
 const results=Array.isArray(pageRow.media)?pageRow.media.map(item=>normalizeAniListMedia(item,mediaType)).filter((item):item is NormalizedMedia=>Boolean(item)):[];
 const info=pageRow.pageInfo&&typeof pageRow.pageInfo==='object'&&!Array.isArray(pageRow.pageInfo)?pageRow.pageInfo as Record<string,unknown>:{};
 return {results,page:Number(info.currentPage||page),hasNextPage:Boolean(info.hasNextPage)};
}

function normalizeJikanMedia(value:unknown,mediaType:MediaType):NormalizedMedia|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const row=value as Record<string,unknown>,id=integer(row.mal_id);
 if(id==null)return null;
 const titles=Array.isArray(row.titles)?row.titles.flatMap(item=>item&&typeof item==='object'&&!Array.isArray(item)&&text((item as Record<string,unknown>).title)?[String((item as Record<string,unknown>).title)]:[]):[];
 const canonical=text(row.title_english)||text(row.title)||text(row.title_japanese);
 if(!canonical)return null;
 const images=row.images&&typeof row.images==='object'&&!Array.isArray(row.images)?row.images as Record<string,unknown>:{};
 const jpg=images.jpg&&typeof images.jpg==='object'&&!Array.isArray(images.jpg)?images.jpg as Record<string,unknown>:{};
 const trailer=row.trailer&&typeof row.trailer==='object'&&!Array.isArray(row.trailer)?row.trailer as Record<string,unknown>:{};
 const aired=row.aired&&typeof row.aired==='object'&&!Array.isArray(row.aired)?row.aired as Record<string,unknown>:{};
 const published=row.published&&typeof row.published==='object'&&!Array.isArray(row.published)?row.published as Record<string,unknown>:{};
 const sourceRange=mediaType==='anime'?aired:published;
 const from=sourceRange.from instanceof String?String(sourceRange.from):text(sourceRange.from);
 const to=text(sourceRange.to);
 const genres=Array.isArray(row.genres)?row.genres.flatMap(item=>item&&typeof item==='object'&&!Array.isArray(item)&&text((item as Record<string,unknown>).name)?[String((item as Record<string,unknown>).name)]:[]):[];
 const studios=Array.isArray(row.studios)?row.studios.flatMap(item=>item&&typeof item==='object'&&!Array.isArray(item)&&text((item as Record<string,unknown>).name)?[String((item as Record<string,unknown>).name)]:[]):[];
 const year=integer(row.year)||Number(from?.slice(0,4))||null;
 return {
  provider:'jikan',mediaType,externalId:String(id),canonicalUrl:text(row.url),externalIds:[{provider:'myanimelist',externalId:String(id),canonicalUrl:text(row.url)}],titleCanonical:canonical,
  titleEnglish:text(row.title_english),titleRomaji:text(row.title),titleNative:text(row.title_japanese),
  alternativeTitles:[...new Set([...stringArray(row.title_synonyms),...titles])].filter(title=>title!==canonical),
  synopsis:text(row.synopsis),format:text(row.type),status:normalizeProviderStatus(text(row.status)),releaseYear:Number.isFinite(year)?year:null,
  startDate:from?.slice(0,10)||null,endDate:to?.slice(0,10)||null,
  itemCount:mediaType==='anime'?integer(row.episodes):integer(row.chapters),
  durationMinutes:null,genres,tags:[],studios,coverImageUrl:text(jpg.large_image_url)||text(jpg.image_url),
  bannerImageUrl:null,officialWebsite:text(trailer.url),providerUpdatedAt:null
 };
}

export async function searchJikan(query:string,mediaType:MediaType,page=1,limit=10){
 const resource=mediaType==='anime'?'anime':'manga';
 const url=new URL(`${JIKAN_ENDPOINT}/${resource}`);
 url.searchParams.set('q',query);url.searchParams.set('page',String(Math.max(1,page)));url.searchParams.set('limit',String(Math.max(1,Math.min(limit,25))));
 if(mediaType==='anime')url.searchParams.set('sfw','true');
 const {value}=await providerFetch(url.toString(),{method:'GET'},'jikan');
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Jikan returned an invalid response.');
 const payload=value as Record<string,unknown>,results=Array.isArray(payload.data)?payload.data.map(item=>normalizeJikanMedia(item,mediaType)).filter((item):item is NormalizedMedia=>Boolean(item)):[];
 const pagination=payload.pagination&&typeof payload.pagination==='object'&&!Array.isArray(payload.pagination)?payload.pagination as Record<string,unknown>:{};
 return {results,page,hasNextPage:Boolean(pagination.has_next_page)};
}
