'use client';
import {useState} from 'react';
export default function ForgotPassword(){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);const r=await fetch('/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const d:any=await r.json();setMessage(d.message||'If an account exists for that email, a password reset link has been sent.');setBusy(false)};
 return <main className="auth-shell"><section className="auth-card"><a className="auth-brand" href="/">ANIME CLASH</a><h1>Forgot password</h1><p>Enter your email. The response stays deliberately vague because account-enumeration attacks are a hobby humanity apparently needed.</p>{message&&<div className="auth-notice">{message}</div>}<form className="auth-form" onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className="auth-primary" disabled={busy}>{busy?'Sending…':'Send reset link'}</button></form><a className="auth-link" href="/auth">Back to sign in</a></section></main>
}
