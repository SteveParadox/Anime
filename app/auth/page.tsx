'use client';
import {useEffect,useState} from 'react';

function safeReturn(value:string|null){return value&&value.startsWith('/')&&!value.startsWith('//')?value:'/'}

export default function AuthPage(){
 const [mode,setMode]=useState<'login'|'register'>('login'),[returnTo,setReturnTo]=useState('/'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false);
 const [form,setForm]=useState({email:'',password:'',username:'',displayName:''});
 useEffect(()=>{const q=new URLSearchParams(location.search);setReturnTo(safeReturn(q.get('return_to')));if(q.get('mode')==='register')setMode('register');const oauth=q.get('error');if(oauth)setError(oauth==='google_cancelled'?'Google sign-in was cancelled.':'Google sign-in could not be completed. Please try again.');},[]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');try{
  const endpoint=mode==='login'?'/api/auth/login':'/api/auth/register',payload=mode==='login'?{email:form.email,password:form.password}:form;
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d:any=await r.json();
  if(!r.ok)throw Error(d.error||'Authentication failed.');
  if(mode==='register'){
   setNotice(d.verificationEmailSent?'Account created. Check your email for the verification link.':d.emailDeliveryConfigured===false?'Account created. Email delivery is not configured yet; use the configured development mail link or deployment email provider.':'Account created. Check your email for verification.');
   setTimeout(()=>{location.href=returnTo},900);
  }else location.href=returnTo;
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}};
 const providerReturn=encodeURIComponent(returnTo);
 return <main className="auth-shell"><section className="auth-card"><a className="auth-brand" href="/">ANIME CLASH</a><div className="auth-switch"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('')}} type="button">Sign in</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('')}} type="button">Create account</button></div><h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{mode==='login'?'Sign in to vote, build squads, save progress, and join discussions.':'Your profile is created automatically and stays the same whichever login method you use.'}</p>
 {error&&<div className="auth-error" role="alert">{error}</div>}{notice&&<div className="auth-notice">{notice}</div>}
 <form onSubmit={submit} className="auth-form">{mode==='register'&&<><label>Username<input autoComplete="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value.toLowerCase()})} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required/></label><label>Display name<input autoComplete="name" value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} maxLength={120} required/></label></>}<label>Email<input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} maxLength={320} required/></label><label>Password<span className="password-field"><input type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength={8} maxLength={128} required/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'Hide password':'Show password'}>{show?'Hide':'Show'}</button></span></label><button className="auth-primary" disabled={busy}>{busy?'Working…':mode==='login'?'Sign in':'Create account'}</button></form>
 {mode==='login'&&<a className="auth-link" href="/forgot-password">Forgot password?</a>}
 <div className="auth-divider"><span>OR</span></div><a className="auth-provider" href={'/api/auth/google?return_to='+providerReturn}>Continue with Google</a><a className="auth-provider secondary-provider" href={'/signin-with-chatgpt?return_to='+providerReturn}>Continue with ChatGPT</a><p className="auth-foot">Public browsing does not require an account.</p></section></main>
}
