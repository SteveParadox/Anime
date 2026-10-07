import {z} from 'zod';
import {database} from '@/db/raw';
import {getCurrentUser} from '@/lib/auth';
import {normalizeUsername,validUsername} from '@/lib/auth-crypto';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';

const input=z.object({username:z.string().min(3).max(24),displayName:z.string().trim().min(1).max(120)}).strict();

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 const user=await getCurrentUser();if(!user)return authJson({error:'Sign in first.'},401);
 const parsed=input.safeParse(await readJson(request));if(!parsed.success)return authJson({error:'Check the profile fields.'},400);
 const username=normalizeUsername(parsed.data.username);if(!validUsername(username))return authJson({error:'Username must be 3–24 characters using lowercase letters, numbers, or underscores.'},400);
 const db=database(),owner=await db.prepare('SELECT user FROM profiles WHERE handle=?').bind(username).first<any>();
 if(owner&&owner.user!==user.userId)return authJson({error:'That username is already taken.'},409);
 const now=Date.now();
 await db.batch([
  db.prepare('UPDATE profiles SET handle=?,display_name=?,updated=? WHERE user=?').bind(username,parsed.data.displayName.trim(),now,user.userId),
  db.prepare('UPDATE users SET profile_completed=1,updated=? WHERE id=?').bind(now,user.userId)
 ]);
 return authJson({ok:true,username,displayName:parsed.data.displayName.trim()});
}
