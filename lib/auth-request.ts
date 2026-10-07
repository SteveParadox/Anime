export const authJson=(data:unknown,status=200,headers?:HeadersInit)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});

export function sameOrigin(request:Request){
 const expected=new URL(request.url).origin,origin=request.headers.get('origin');
 if(origin)return origin===expected;
 const fetchSite=request.headers.get('sec-fetch-site');
 if(fetchSite==='cross-site'||fetchSite==='same-site')return false;
 const referer=request.headers.get('referer');
 if(referer){
  try{return new URL(referer).origin===expected}catch{return false}
 }
 return true;
}

export async function readJson(request:Request,maxBytes=10_000){
 const declared=Number(request.headers.get('content-length')||0);
 if(Number.isFinite(declared)&&declared>maxBytes)throw Object.assign(new Error('Request body is too large.'),{status:413});
 const raw=await request.text();
 if(new TextEncoder().encode(raw).byteLength>maxBytes)throw Object.assign(new Error('Request body is too large.'),{status:413});
 try{return JSON.parse(raw)}catch{throw Object.assign(new Error('Invalid JSON request.'),{status:400})}
}
