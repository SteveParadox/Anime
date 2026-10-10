export const MEDIA_TYPES=['anime','manga'] as const;
export type MediaType=typeof MEDIA_TYPES[number];

export const TRACKING_STATUSES=['planned','watching','completed','paused','dropped','rewatching','reading','rereading'] as const;
export type TrackingStatus=typeof TRACKING_STATUSES[number];

export const ACTIVITY_VISIBILITIES=['private','followers','public'] as const;
export type ActivityVisibility=typeof ACTIVITY_VISIBILITIES[number];

export const MEDIA_PROVIDERS=['anilist','jikan'] as const;
export type MediaProvider=typeof MEDIA_PROVIDERS[number];

export type ExternalMediaId={provider:'anilist'|'myanimelist';externalId:string;canonicalUrl:string|null};

export type NormalizedMedia={
 provider:MediaProvider;
 mediaType:MediaType;
 externalId:string;
 canonicalUrl:string|null;
 externalIds:ExternalMediaId[];
 titleCanonical:string;
 titleEnglish:string|null;
 titleRomaji:string|null;
 titleNative:string|null;
 alternativeTitles:string[];
 synopsis:string|null;
 format:string|null;
 status:string|null;
 releaseYear:number|null;
 startDate:string|null;
 endDate:string|null;
 itemCount:number|null;
 durationMinutes:number|null;
 genres:string[];
 tags:string[];
 studios:string[];
 coverImageUrl:string|null;
 bannerImageUrl:string|null;
 officialWebsite:string|null;
 providerUpdatedAt:number|null;
};

export function normalizeSearchText(values:(string|null|undefined)[]){
 return values.filter((value):value is string=>Boolean(value&&value.trim())).join(' ').toLowerCase().replace(/[^a-z0-9\p{L}\p{N}]+/gu,' ').trim();
}

export function stableMediaId(type:MediaType,provider:MediaProvider,externalId:string){
 const safe=externalId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
 if(!safe)throw new Error('External media ID is required.');
 return `${type}-${provider}-${safe}`;
}

export function normalizeProviderStatus(value:string|null|undefined){
 const normalized=(value||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
 if(['finished','finished_airing','finished_publishing','completed'].includes(normalized))return 'completed';
 if(['releasing','currently_airing','currently_publishing','publishing','airing'].includes(normalized))return 'releasing';
 if(['not_yet_released','not_yet_aired','not_yet_published','upcoming'].includes(normalized))return 'upcoming';
 if(['cancelled','canceled'].includes(normalized))return 'cancelled';
 if(['hiatus'].includes(normalized))return 'hiatus';
 return normalized||null;
}

export type ViewerProgress={
 mediaType:MediaType;
 mediaId:string;
 currentPosition:string|null;
 completedItemIds:Set<string>;
 explicitReveal:boolean;
};

export type SpoilerBoundary={
 mediaType:MediaType;
 mediaId:string;
 position?:string|null;
 itemId?:string|null;
};

function numericPosition(value:string|null|undefined){
 if(value==null||value==='')return null;
 const parsed=Number(value);
 return Number.isFinite(parsed)?parsed:null;
}

export function canViewSpoiler(progress:ViewerProgress|null|undefined,boundary:SpoilerBoundary|null|undefined){
 if(!boundary)return true;
 if(!progress)return false;
 if(progress.explicitReveal)return true;
 if(progress.mediaType!==boundary.mediaType||progress.mediaId!==boundary.mediaId)return false;
 if(boundary.itemId&&progress.completedItemIds.has(boundary.itemId))return true;
 const required=numericPosition(boundary.position),current=numericPosition(progress.currentPosition);
 if(required==null)return false;
 return current!=null&&current>=required;
}

export const PROFILE_RANKS=[
 {id:'rookie',label:'Rookie',minPoints:0},
 {id:'challenger',label:'Challenger',minPoints:25},
 {id:'fighter',label:'Fighter',minPoints:75},
 {id:'strategist',label:'Strategist',minPoints:175},
 {id:'veteran',label:'Veteran',minPoints:350},
 {id:'elite',label:'Elite',minPoints:700},
 {id:'legend',label:'Legend',minPoints:1500}
] as const;

export function rankForPoints(points:number){
 const safe=Math.max(0,Math.floor(Number.isFinite(points)?points:0));
 return [...PROFILE_RANKS].reverse().find(rank=>safe>=rank.minPoints)??PROFILE_RANKS[0];
}
