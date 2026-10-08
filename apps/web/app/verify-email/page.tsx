'use client';
import {apiFetch} from '@/services/api';
import {useEffect,useState} from 'react';
export default function VerifyEmail(){
 const [state,setState]=useState<'working'|'done'|'error'>('working'),[message,setMessage]=useState('Verifying your email…');
 useEffect(()=>{const token=new URLSearchParams(location.hash.slice(1)).get('token')||new URLSearchParams(location.search).get('token')||'';history.replaceState(null,'','/verify-email');(async()=>{if(!token){setState('error');setMessage('The verification link is missing its token.');return}const r=await apiFetch('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}),d:any=await r.json();if(r.ok){setState('done');setMessage(d.alreadyVerified?'Your email was already verified.':'Email verified successfully.')}else{setState('error');setMessage(d.error||'The verification link is invalid or expired.')}})()},[]);
 return <main className="auth-shell"><section className="auth-card"><a className="auth-brand" href="/">ANIME CLASH</a><h1>Verify email</h1><div className={state==='error'?'auth-error':'auth-notice'}>{message}</div>{state!=='working'&&<a className="auth-primary auth-button-link" href="/">Continue to Anime Clash</a>}</section></main>
}
