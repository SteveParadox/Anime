export const authJson=(data:unknown,status=200,headers?:HeadersInit)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});

export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');
 return !origin||origin===new URL(request.url).origin;
}

export async function readJson(request:Request,maxBytes=10_000){
 const raw=await request.text();
 if(raw.length>maxBytes)throw Object.assign(new Error('Request body is too large.'),{status:413});
 try{return JSON.parse(raw)}catch{throw Object.assign(new Error('Invalid JSON request.'),{status:400})}
}
