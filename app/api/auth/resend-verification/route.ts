import {getCurrentUser} from '@/lib/auth';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,sameOrigin} from '@/lib/auth-request';
import {appBaseUrl,createVerificationToken,VERIFY_TTL_MINUTES} from '@/lib/auth-tokens';
import {sendVerificationEmail} from '@/lib/email';

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 const user=await getCurrentUser();
 if(!user)return authJson({error:'Sign in first.'},401);
 if(user.emailVerified)return authJson({ok:true,alreadyVerified:true});
 if(!user.email)return authJson({error:'This account does not have an email address to verify.'},400);
 const limit=await enforceAuthRateLimits(request,'resend-verification',user.userId,{ipLimit:8,identityLimit:3,windowMs:30*60_000});
 if(!limit.allowed)return authJson({error:'Please wait before requesting another verification email.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
 const token=await createVerificationToken(user.userId),delivery=await sendVerificationEmail(user.email,`${appBaseUrl(request)}/verify-email?token=${encodeURIComponent(token.raw)}`,VERIFY_TTL_MINUTES);
 return authJson({ok:true,emailSent:delivery.sent});
}
