export class ApiError extends Error{
 constructor(message:string,readonly status:number){super(message);this.name='ApiError';}
}

export async function apiFetch(path:string,init:RequestInit={}):Promise<Response>{
 if(!path.startsWith('/api/')||path.startsWith('//'))throw new Error('API requests must use same-origin /api paths');
 const method=(init.method||'GET').toUpperCase();
 const tries=method==='GET'?2:1;
 for(let attempt=0;attempt<tries;attempt++){
  try{
   const response=await fetch(path,{...init,credentials:'same-origin',cache:'no-store'});
   if(response.status===503&&attempt+1<tries)continue;
   return response;
  }catch(error){
   if(init.signal?.aborted)throw error;
   if(attempt+1===tries)throw new ApiError('Could not reach Anime Clash. Please try again.',0);
  }
 }
 throw new Error('API retry state is invalid');
}

export async function apiJson<T>(path:string,init:RequestInit={}):Promise<T>{
 const response=await apiFetch(path,init);
 let payload:unknown;
 try{payload=await response.json();}catch{throw new ApiError('The server returned an invalid response.',response.status);}
 if(!response.ok){
  const message=payload&&typeof payload==='object'&&'error' in payload&&typeof payload.error==='string'
   ?payload.error:'Request could not be completed.';
  throw new ApiError(message,response.status);
 }
 return payload as T;
}
