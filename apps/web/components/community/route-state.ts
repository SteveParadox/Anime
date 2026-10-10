/** Pure route and draft helpers used by the community views and their regression tests. */
export function communityViewKey(view:string,clubId:string,profileHandle:string):string{
 if(view==='clubs')return 'clubs:'+clubId;
 if(view==='profile')return 'profile:'+(profileHandle||'me');
 return view;
}

/** A request for an old route must never replace the active route's data. */
export function shouldApplyCommunityResponse(expectedKey:string,activeKey:string,requestNumber:number,latestRequest:number):boolean{
 return expectedKey===activeKey&&requestNumber===latestRequest;
}

/** Discussion drafts are kept independently so changing anime clubs cannot cross-post text. */
export function updateClubDraft(drafts:Readonly<Record<string,string>>,clubId:string,text:string):Record<string,string>{
 return {...drafts,[clubId]:text};
}
