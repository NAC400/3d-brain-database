import React, { useState, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import {
  signInWithEmail, signUpWithEmail, signOut,
  onAuthStateChange, isSupabaseConfigured, resendConfirmationEmail,
  sendPasswordResetEmail, updateCurrentUserPassword,
} from '../lib/supabase';

const AuthPage: React.FC = () => {
  const { user, setUser, setAppPage } = useBrainStore();

  const [mode, setMode]         = useState<'signin' | 'signup' | 'reset'>(
    new URLSearchParams(window.location.search).has('reset-password') ? 'reset' : 'signin'
  );
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [canResend, setCanResend] = useState(false);
  const isRecoveryRoute = new URLSearchParams(window.location.search).has('reset-password');

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const unsub = onAuthStateChange((supaUser, event) => {
      if (event === 'PASSWORD_RECOVERY' || isRecoveryRoute) {
        setMode('reset');
      } else if (supaUser) {
        setUser({ id: supaUser.id, email: supaUser.email ?? '', plan: 'free' });
      }
    });
    return unsub;
  }, [setUser, isRecoveryRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setCanResend(false); setLoading(true);
    try {
      if (mode === 'reset') {
        if (password.length < 8) { setError('Choose a password with at least 8 characters.'); return; }
        const result = await updateCurrentUserPassword(password);
        if (result.error) setError('Your reset link has expired. Request a new password-reset email.');
        else {
          setMessage('Password updated. You can now sign in.');
          setMode('signin');
          window.history.replaceState({}, '', window.location.pathname);
        }
        return;
      }

      const result = mode === 'signin'
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
      if (result.error) {
        const message = result.error.message.toLowerCase();
        if (message.includes('email not confirmed')) {
          setError('Please verify your email before signing in.');
          setCanResend(true);
        } else if (message.includes('invalid login credentials')) {
          setError('Email or password is incorrect. You can reset your password below.');
        } else {
          setError(result.error.message);
        }
      } else if (mode === 'signup') {
        if (result.data.user?.identities?.length === 0) {
          setMessage('This email may already be registered. Sign in, or use “Forgot password?” to reset your password.');
          setMode('signin');
        } else {
          setMessage('Account created. Check your email to verify it, then sign in.');
          setMode('signin');
        }
      } else if (result.data && 'user' in result.data && result.data.user) {
        setUser({ id: result.data.user.id, email: result.data.user.email ?? '', plan: 'free' });
        setAppPage('explorer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) { setError('Enter your email address first, then choose Forgot password.'); return; }
    setError(''); setMessage(''); setLoading(true);
    try {
      const result = await sendPasswordResetEmail(email.trim());
      if (result.error) setError(result.error.message);
      else setMessage('If this address has an account, a password-reset email has been sent.');
    } finally { setLoading(false); }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setError(''); setMessage(''); setLoading(true);
    try {
      const result = await resendConfirmationEmail(email.trim());
      if (result.error) setError(result.error.message);
      else setMessage('A new verification email has been requested. Check spam as well.');
    } finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 8,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(59,130,246,0.25)',
    color: '#e2e8f0', fontSize: 14, outline: 'none',
  };

  // ── Signed-in view ──
  if (user && mode !== 'reset') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 400, background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16,
          padding: '40px 36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
            {user.email}
          </div>
          <div style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 99,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: 'var(--product-accent)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
            textTransform: 'uppercase', marginBottom: 28,
          }}>
            {user.plan} plan
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setAppPage('explorer')}
              style={{
                padding: '10px 0', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                color: 'var(--product-accent)', fontSize: 14,
              }}
            >Back to Explorer</button>
            <button
              onClick={handleSignOut}
              style={{
                padding: '10px 0', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: 14,
              }}
            >Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 420, background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="product-wordmark">MAPPED<span>.</span><small>NEUROSCIENCE RESEARCH & LEARNING</small></span>
        </div>

        {mode === 'reset' ? (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Choose a new password</div>
            <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 6 }}>Use at least 8 characters.</div>
          </div>
        ) : (
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)' }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: mode === m ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: mode === m ? 'var(--product-accent)' : '#475569',
            }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
        )}

        {!isSupabaseConfigured() && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#fbbf24', fontSize: 12,
          }}>
            Supabase not configured. Add <code>REACT_APP_SUPABASE_URL</code> and <code>REACT_APP_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode !== 'reset' && <div>
            <label style={{ fontSize: 11, color: 'var(--product-muted)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required placeholder="your@email.com" />
          </div>}
          <div>
            <label style={{ fontSize: 11, color: 'var(--product-muted)', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>{mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 12 }}>
              {message}
            </div>
          )}

          {canResend && (
            <button type="button" onClick={handleResendConfirmation} disabled={loading} style={{ padding: '8px 0', borderRadius: 7, background: 'transparent', border: '1px solid rgba(59,130,246,0.35)', color: 'var(--product-accent)', cursor: 'pointer', fontSize: 12 }}>
              Resend verification email
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured()}
            style={{
              padding: '11px 0', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(30,64,175,0.8))',
              border: '1px solid rgba(59,130,246,0.5)', color: '#e0eaff',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Update Password'}
          </button>
        </form>

        {mode === 'signin' && <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button type="button" onClick={handlePasswordReset} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--product-accent)', cursor: 'pointer', fontSize: 11 }}>
            Forgot password?
          </button>
        </div>}

        {mode !== 'reset' && <p style={{ fontSize: 11, color: 'var(--product-muted)', textAlign: 'center', marginTop: 20 }}>
          {mode === 'signin' ? 'No account? ' : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 }}>
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>}
      </div>
    </div>
  );
};

export default AuthPage;
