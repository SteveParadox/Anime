import {authJson} from '@/lib/auth-request';
import {hostedPlatformHeadersTrusted} from '@/lib/auth';
import {googleConfig} from '@/lib/google-auth';

export async function GET(){
 const google=googleConfig().configured;
 const chatgpt=await hostedPlatformHeadersTrusted();
 return authJson({google,chatgpt});
}
