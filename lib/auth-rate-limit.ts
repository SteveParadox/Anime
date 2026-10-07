import {database} from '@/db/raw';
import {env} from 'cloudflare:workers';
import {hashOpaqueToken} from '@/lib/auth-crypto';

export type RateLimitResult={allowed:boolean;retryAfterSeconds:number};

export function requestIp(request:Request){
 const cloudflare=request.headers.get('cf-connecting-ip')?.trim();
 if(cloudflare)return cloudflare;
 if(env.AUTH_TRUST_PROXY_IP_HEADERS==='true'){
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')?.trim()||'unknown';
 }
 return 'unknown';
}

export async function checkRateLimit(scope:string,rawKey:string,limit:number,windowMs:number,blockMs=windowMs):Promise<RateLimitResult>{
 const db=database(),now=Date.now(),keyHash=await hashOpaqueToken(`${scope}:${rawKey}`);
 const row=await db.prepare(`
  INSERT INTO auth_rate_limits (key_hash,scope,window_start,count,blocked_until)
  VALUES (?,?,?,1,0)
  ON CONFLICT(key_hash) DO UPDATE SET
   scope=excluded.scope,
   window_start=CASE
    WHEN excluded.window_start-auth_rate_limits.window_start>=? THEN excluded.window_start
    ELSE auth_rate_limits.window_start
   END,
   count=CASE
    WHEN excluded.window_start-auth_rate_limits.window_start>=? THEN 1
    ELSE auth_rate_limits.count+1
   END,
   blocked_until=CASE
    WHEN auth_rate_limits.blocked_until>excluded.window_start THEN auth_rate_limits.blocked_until
    WHEN excluded.window_start-auth_rate_limits.window_start>=? THEN 0
    WHEN auth_rate_limits.count+1>? THEN excluded.window_start+?
    ELSE 0
   END
  RETURNING count,blocked_until AS blockedUntil
 `).bind(keyHash,scope,now,windowMs,windowMs,windowMs,limit,blockMs).first<any>();
 if(!row)throw new Error('Rate limiter state could not be updated.');
 const blockedUntil=Number(row.blockedUntil||0),count=Number(row.count||0);
 if(blockedUntil>now||count>limit)return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((Math.max(blockedUntil,now+1000)-now)/1000))};
 return {allowed:true,retryAfterSeconds:0};
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
