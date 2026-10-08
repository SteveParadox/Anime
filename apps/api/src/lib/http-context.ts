import {AsyncLocalStorage} from 'node:async_hooks';

type HttpContext={request:Request;outgoingCookies:string[]};
const context=new AsyncLocalStorage<HttpContext>();
export const withHttpContext=<T>(value:HttpContext,work:()=>Promise<T>)=>context.run(value,work);
export function outgoingCookies(){return context.getStore()?.outgoingCookies||[];}
function current(){const item=context.getStore();if(!item)throw new Error('HTTP request context is missing');return item;}
export async function cookies(){
 const item=current();
 const existing=new Map((item.request.headers.get('cookie')||'').split(';').map(entry=>entry.trim().split(/=(.*)/s).slice(0,2) as [string,string]));
 return {
  get(name:string){const value=existing.get(name);return value?{name,value:decodeURIComponent(value)}:undefined;},
  set(name:string,value:string,options:{httpOnly?:boolean;secure?:boolean;sameSite?:string;path?:string;expires?:Date}={}){
   const parts=[`${name}=${encodeURIComponent(value)}`,`Path=${options.path||'/'}`];
   if(options.httpOnly)parts.push('HttpOnly');
   if(options.secure)parts.push('Secure');
   if(options.sameSite)parts.push(`SameSite=${options.sameSite}`);
   if(options.expires)parts.push(`Expires=${options.expires.toUTCString()}`);
   item.outgoingCookies.push(parts.join('; '));
  },
  delete(name:string){this.set(name,'',{path:'/',httpOnly:true,secure:name.startsWith('__Host-'),sameSite:'lax',expires:new Date(0)});}
 };
}
