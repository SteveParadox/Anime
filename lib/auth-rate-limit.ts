import {database} from '@/db/raw';
import {hashOpaqueToken} from '@/lib/auth-crypto';

export type RateLimitResult={allowed:boolean;retryAfterSeconds:number};

export function requestIp(request:Request){
 return request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
}

export async function checkRateLimit(scope:string,rawKey:string,limit:number,windowMs:number,blockMs=windowMs):Promise<RateLimitResult>{
 const db=database(),now=Date.now(),keyHash=await hashOpaqueToken(`${scope}:${rawKey}`);
 const row=await db.prepare('SELECT window_start AS windowStart,count,blocked_until AS blockedUntil FROM auth_rate_limits WHERE key_hash=?').bind(keyHash).first<any>();
 if(row&&Number(row.blockedUntil||0)>now)return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((Number(row.blockedUntil)-now)/1000))};
 if(!row||now-Number(row.windowStart)>=windowMs){
  await db.prepare('INSERT INTO auth_rate_limits (key_hash,scope,window_start,count,blocked_until) VALUES (?,?,?,1,0) ON CONFLICT(key_hash) DO UPDATE SET scope=excluded.scope,window_start=excluded.window_start,count=1,blocked_until=0').bind(keyHash,scope,now).run();
  return {allowed:true,retryAfterSeconds:0};
 }
 const next=Number(row.count||0)+1;
 const blockedUntil=next>limit?now+blockMs:0;
 await db.prepare('UPDATE auth_rate_limits SET count=?,blocked_until=? WHERE key_hash=?').bind(next,blockedUntil,keyHash).run();
 return next>limit?{allowed:false,retryAfterSeconds:Math.max(1,Math.ceil(blockMs/1000))}:{allowed:true,retryAfterSeconds:0};
}

export async function enforceAuthRateLimits(request:Request,scope:string,identity?:string,options?:{ipLimit?:number;identityLimit?:number;windowMs?:number;blockMs?:number}){
 const windowMs=options?.windowMs??15*60_000,blockMs=options?.blockMs??15*60_000;
 const ip=await checkRateLimit(scope,requestIp(request),options?.ipLimit??12,windowMs,blockMs);
 if(!ip.allowed)return ip;
 if(identity){
  const keyed=await checkRateLimit(scope,identity,options?.identityLimit??8,windowMs,blockMs);
  if(!keyed.allowed)return keyed;
 }
 return {allowed:true,retryAfterSeconds:0};
}
