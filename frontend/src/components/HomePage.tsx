import React, { useEffect, useRef } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { BrainState } from '../store/brainStore';

interface Feature {
  icon:       string;
  title:      string;
  desc:       string;
  badge:      string;
  badgeColor: string;
  page:       BrainState['appPage'];
  cta:        string;
}

const FEATURES: Feature[] = [
  {
    icon: '🧠',
    title: '3D Brain Explorer',
    desc: 'Navigate a fully segmented 141-region Allen Atlas model. Isolate, explode, layer, and cross-section any anatomical structure in real time.',
    badge: 'Live',
    badgeColor: '#22d3ee',
    page: 'explorer',
    cta: 'Open Explorer →',
  },
  {
    icon: '📚',
    title: 'Research Engine',
    desc: 'Import papers via PubMed or DOI. Link sources directly to brain regions, fetch abstracts, and cite in APA, MLA, Vancouver, Chicago, or BibTeX.',
    badge: 'Live',
    badgeColor: '#22d3ee',
    page: 'library',
    cta: 'Open Library →',
  },
  {
    icon: '🌐',
    title: 'Community Atlas',
    desc: 'Share verified region–source links with the global neuroscience community. Collaborate on annotating the human brain with peer-reviewed evidence.',
    badge: 'Live',
    badgeColor: '#22d3ee',
    page: 'community',
    cta: 'View Atlas →',
  },
];

const HomePage: React.FC = () => {
  const { setAppPage, sources, structureLinks, user } = useBrainStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: 'radial-gradient(ellipse at 50% 20%, #0f1f3d 0%, #070c18 70%)',
      display: 'flex', flexDirection: 'column',
      overflow: 'auto',
    }}>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />

      {/* ── Header ── */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 36px',
        borderBottom: '1px solid rgba(59,130,246,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
            boxShadow: '0 0 18px rgba(59,130,246,0.55)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 3, color: '#e0eaff' }}>MAPPED</div>
            <div style={{ fontSize: 9, color: '#334155', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              3D Brain Research Platform
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setAppPage('explorer')} style={{ padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(59,130,246,0.35)', color: '#60a5fa' }}>
            Explorer
          </button>
          <button onClick={() => setAppPage('library')} style={{ padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(100,116,139,0.25)', color: '#94a3b8' }}>
            Library
          </button>
          <button onClick={() => setAppPage('community')} style={{ padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(100,116,139,0.25)', color: '#94a3b8' }}>
            Community
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(30,64,175,0.4)' }} />
          {user ? (
            <button onClick={() => setAppPage('auth')} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
              {user.email.split('@')[0]}
            </button>
          ) : (
            <button onClick={() => setAppPage('auth')} style={{ padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: '72px 24px 56px',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block', padding: '3px 14px', borderRadius: 20, marginBottom: 24,
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
          fontSize: 11, fontWeight: 600, color: '#60a5fa', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Alpha · Allen Human Reference Atlas · 141 Regions
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 58px)',
          fontWeight: 800, color: '#f1f5f9',
          margin: '0 0 20px', lineHeight: 1.15,
          maxWidth: 720,
          letterSpacing: -0.5,
        }}>
          Explore the Human Brain<br />
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>in Three Dimensions</span>
        </h1>

        <p style={{
          fontSize: 17, color: '#64748b', maxWidth: 560,
          lineHeight: 1.7, margin: '0 0 40px',
        }}>
          Multilayer Anatomical Platform for Personalized Exploration & Discovery.
          Link peer-reviewed research directly to neuroanatomical structures.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setAppPage('explorer')}
            style={{
              padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.9))',
              border: 'none', color: '#fff',
              boxShadow: '0 0 24px rgba(59,130,246,0.35)',
            }}
          >
            Open Brain Explorer →
          </button>
          <button
            onClick={() => setAppPage('library')}
            style={{
              padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'transparent',
              border: '1px solid rgba(59,130,246,0.35)', color: '#60a5fa',
            }}
          >
            View Research Library
          </button>
        </div>

        {/* Live stats */}
        {(sources.length > 0 || structureLinks.length > 0) && (
          <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
            {[
              { label: 'Sources', value: sources.length },
              { label: 'Region links', value: structureLinks.length },
              { label: 'Brain regions', value: 141 },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#334155', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Feature cards ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        padding: '0 36px 64px',
        maxWidth: 1100, margin: '0 auto', width: '100%',
      }}>
        {FEATURES.map((f) => (
          <button
            key={f.title}
            onClick={() => setAppPage(f.page)}
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(59,130,246,0.12)',
              borderRadius: 14, padding: '28px 24px',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
              e.currentTarget.style.background  = 'rgba(15,23,42,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.12)';
              e.currentTarget.style.background  = 'rgba(15,23,42,0.7)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{f.title}</div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: f.badgeColor }}>
                  {f.badge}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '0 0 16px' }}>
              {f.desc}
            </p>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>{f.cta}</span>
          </button>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(30,41,59,0.6)',
        padding: '18px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: '#1e293b', fontSize: 11,
      }}>
        <span>MAPPED · Alpha build · Allen Human Reference Atlas 3D</span>
        <span>© 2026</span>
      </div>
    </div>
  );
};

export default HomePage;
