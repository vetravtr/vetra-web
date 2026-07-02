'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', country: '' });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setPasswordError('');

    // Validação de senha forte no cadastro
    if (tab === 'register') {
      const pwd = form.password;
      if (pwd.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(pwd)) {
        setPasswordError('Password must contain at least 1 uppercase letter');
        setLoading(false);
        return;
      }
      if (!/[0-9]/.test(pwd)) {
        setPasswordError('Password must contain at least 1 number');
        setLoading(false);
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
        setPasswordError('Password must contain at least 1 special character');
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    if (tab === 'register') {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...form }),
      });
      const d = await r.json();
      if (d.success) {
        setStep('verify');
        setMsg('Verification code sent to your email.');
        await fetch('/api/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
      } else {
        setMsg(d.error || 'Registration failed');
      }
    } else {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: form.email, password: form.password }),
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem('vetra_token', d.token);
        localStorage.setItem('vetra_user', JSON.stringify(d.user));
        router.push('/dashboard');
      } else {
        setMsg(d.error || 'Login failed');
      }
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_code', email: form.email, code }),
    });
    const d = await r.json();
    if (d.success) {
      localStorage.setItem('vetra_token', d.token);
      localStorage.setItem('vetra_user', JSON.stringify(d.user));
      router.push('/dashboard');
    } else {
      setMsg(d.error || 'Invalid code');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[rgb(5,1,9)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/partners/vetra.svg" alt="VETRA" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">VETRA Dashboard</h1>
          <p className="text-sm text-white/50 mt-1">Transparency & Portfolio Management</p>
        </div>

        {step === 'form' ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
            <div className="flex mb-6 bg-white/[0.05] rounded-lg p-1">
              <button onClick={() => setTab('login')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${tab === 'login' ? 'bg-[#643390] text-white' : 'text-white/50'}`}>Sign In</button>
              <button onClick={() => setTab('register')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${tab === 'register' ? 'bg-[#643390] text-white' : 'text-white/50'}`}>Create Account</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <input name="name" placeholder="Full Name *" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30" />
                  <input name="country" placeholder="Country *" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30" />
                </>
              )}
              <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30" />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Password *" required value={form.password} onChange={e => { setForm({...form, password: e.target.value}); setPasswordError(''); }} className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <p className="text-xs text-white/30 mt-1">Min 8 chars, 1 uppercase, 1 number, 1 special. Ex: Vetra@2026</p>
                {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
              </div>
              
              {msg && <p className={`text-xs ${msg.includes('failed') || msg.includes('Invalid') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}

              <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-[#643390] hover:bg-[#9A3CEB] text-white font-medium text-sm transition-colors disabled:opacity-50">
                {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
            <div className="text-center mb-4">
              <img src="/images/partners/vetra.svg" alt="VETRA" className="h-12 mx-auto mb-2" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
            <p className="text-sm text-white/50 mb-6">We sent a 6-digit code to <strong className="text-white/80">{form.email}</strong></p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input type="text" placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-40 mx-auto h-12 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-lg text-center tracking-widest font-mono placeholder:text-white/20" />
              {msg && <p className={`text-xs ${msg.includes('Invalid') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
              <button type="submit" disabled={loading || code.length !== 6} className="w-full h-11 rounded-lg bg-[#643390] hover:bg-[#9A3CEB] text-white font-medium text-sm transition-colors disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
              <button type="button" onClick={() => setStep('form')} className="text-xs text-white/30 hover:text-white/50">Back</button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-white/20 mt-6">2026 Vetra, LLC. All rights reserved.</p>
      </div>
    </div>
  );
}
