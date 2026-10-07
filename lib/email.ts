import {env} from 'cloudflare:workers';

type MailResult={sent:boolean;configured:boolean};

function configured(){
 return Boolean(env.RESEND_API_KEY&&env.EMAIL_FROM);
}

async function send(to:string,subject:string,html:string):Promise<MailResult>{
 if(!configured())return {sent:false,configured:false};
 try{
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,html})
  });
  if(!response.ok){console.error('Authentication email delivery failed',{status:response.status});return {sent:false,configured:true}}
  return {sent:true,configured:true};
 }catch(e){
  console.error('Authentication email delivery failed',{name:(e as Error).name});
  return {sent:false,configured:true};
 }
}

function devLink(kind:string,url:string){
 if(env.AUTH_DEV_EMAIL_LOG==='true'&&env.ENVIRONMENT==='development')console.info(`[auth-dev-email] ${kind}: ${url}`);
}

export async function sendVerificationEmail(to:string,url:string,expiresMinutes:number){
 devLink('verification',url);
 return send(to,'Verify your Anime Clash email',`<p>Welcome to Anime Clash.</p><p><a href="${url}">Verify your email</a></p><p>This link expires in ${expiresMinutes} minutes and can only be used once.</p>`);
}

export async function sendPasswordResetEmail(to:string,url:string,expiresMinutes:number){
 devLink('password-reset',url);
 return send(to,'Reset your Anime Clash password',`<p>A password reset was requested for your Anime Clash account.</p><p><a href="${url}">Reset your password</a></p><p>This link expires in ${expiresMinutes} minutes and can only be used once. If you did not request this, you can ignore this email.</p>`);
}
