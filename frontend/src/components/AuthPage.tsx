import React, { useState, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import {
  signInWithEmail, signUpWithEmail, signOut,
  onAuthStateChange, isSupabaseConfigured,
} from '../lib/supabase';

const AuthPage: React.FC = () => {
  const { user, setUser, setAppPage } = useBrainStore();

  const [mode, setMode]         = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const unsub = onAuthStateChange((supaUser) => {
      if (supaUser) {
        setUser({ id: supaUser.id, email: supaUser.email ?? '', plan: 'free' });
      }
    });
    return unsub;
  }, [setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail;
      const result = await fn(email, password);
      if (result.error) {
        setError(result.error.message);
      } else if (mode === 'signup') {
        setMessage('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      } else if (result.data && 'user' in result.data && result.data.user) {
        setUser({ id: result.data.user.id, email: result.data.user.email ?? '', plan: 'free' });
        setAppPage('explorer');
      }
    } finally {
      setLoading(false);
    }
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
  if (user) {
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
            color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
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
                color: '#60a5fa', fontSize: 14,
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
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)',
          }} />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: '#e0eaff' }}>MAPPED</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>3D Brain Research Platform</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)' }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: mode === m ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: mode === m ? '#60a5fa' : '#475569',
            }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

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
          <div>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required placeholder="your@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>PASSWORD</label>
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
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 20 }}>
          {mode === 'signin' ? 'No account? ' : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 11 }}>
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
