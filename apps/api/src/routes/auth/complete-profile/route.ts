import {z} from 'zod';
import {database} from '@/db/raw';
import {getCurrentUser} from '@/lib/auth';
import {normalizeUsername,validUsername} from '@anime/domain/auth-crypto';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';

const input=z.object({username:z.string().min(3).max(24),displayName:z.string().trim().min(1).max(120)}).strict();

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const user=await getCurrentUser();if(!user)return authJson({error:'Sign in first.'},401);
  const parsed=input.safeParse(await readJson(request));if(!parsed.success)return authJson({error:'Check the profile fields.'},400);
  const username=normalizeUsername(parsed.data.username);if(!validUsername(username))return authJson({error:'Username must be 3–24 characters using lowercase letters, numbers, or underscores.'},400);
  const db=database(),owner=await db.prepare('SELECT user FROM profiles WHERE handle=?').bind(username).first<any>();
  if(owner&&owner.user!==user.userId)return authJson({error:'That username is already taken.'},409);
  const now=Date.now(),displayName=parsed.data.displayName.trim();
  try{
   await db.batch([
    db.prepare(`INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated)
      VALUES (?,?,?,NULL,'','[]','[]',?,?)
      ON CONFLICT(user) DO UPDATE SET handle=excluded.handle,display_name=excluded.display_name,updated=excluded.updated`).bind(user.userId,username,displayName,now,now),
    db.prepare('UPDATE users SET profile_completed=1,updated=? WHERE id=?').bind(now,user.userId)
   ]);
  }catch(e){console.error('Profile completion conflict',{name:(e as Error).name});return authJson({error:'That username is already taken.'},409)}
  return authJson({ok:true,username,displayName});
 }catch(e:any){console.error('Profile completion failed',{name:e?.name});return authJson({error:e?.status===413?'Request body is too large.':'Could not complete the profile.'},e?.status||500)}
}
