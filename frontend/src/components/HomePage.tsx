import React, { useEffect, useRef } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { BrainState } from '../store/brainStore';

// ─── CSS injected for keyframe animations & hover states ───────────────────
const STYLES = `
@keyframes floatA {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(40px,-30px) scale(1.04); }
  66%      { transform: translate(-25px,20px) scale(0.97); }
}
@keyframes floatB {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(-50px,25px) scale(1.03); }
  66%      { transform: translate(30px,-35px) scale(1.06); }
}
@keyframes floatC {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(20px,30px) scale(0.95); }
}
@keyframes brainPulse {
  0%,100% { opacity:0.55; transform:scale(1); }
  50%      { opacity:0.9;  transform:scale(1.07); }
}
@keyframes ringPulse {
  0%   { transform:translate(-50%,-50%) scale(1);   opacity:0.5; }
  100% { transform:translate(-50%,-50%) scale(1.65); opacity:0; }
}
@keyframes orbRotate    { from { transform:rotate(0deg);    } to { transform:rotate(360deg);  } }
@keyframes orbRotateRev { from { transform:rotate(0deg);    } to { transform:rotate(-360deg); } }
@keyframes fadeInUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes marquee {
  from { transform:translateX(0); }
  to   { transform:translateX(-50%); }
}
@keyframes dotPulse {
  0%,100% { opacity:0.4; transform:scale(1);   }
  50%     { opacity:1;   transform:scale(1.45); }
}
@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position:-200% center; }
}

/* ── Card hover ── */
.hp-card {
  transition: transform 0.25s cubic-bezier(.34,1.56,.64,1),
              box-shadow 0.25s ease,
              border-color 0.25s ease !important;
}
.hp-card:hover {
  transform: translateY(-8px) !important;
  box-shadow: 0 28px 70px rgba(0,0,0,0.6) !important;
}
.hp-card-blue:hover   { border-color: rgba(59,130,246,0.45) !important; }
.hp-card-purple:hover { border-color: rgba(139,92,246,0.45) !important; }
.hp-card-cyan:hover   { border-color: rgba(34,211,238,0.45) !important; }

/* ── Buttons ── */
.hp-btn-primary {
  transition: box-shadow 0.2s ease, transform 0.2s ease !important;
}
.hp-btn-primary:hover {
  box-shadow: 0 0 44px rgba(59,130,246,0.65) !important;
  transform: translateY(-2px) !important;
}
.hp-btn-secondary {
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease !important;
}
.hp-btn-secondary:hover {
  background: rgba(59,130,246,0.1) !important;
  border-color: rgba(59,130,246,0.55) !important;
  transform: translateY(-2px) !important;
}

/* ── Nav ── */
.hp-nav-btn {
  transition: color 0.15s ease, background 0.15s ease !important;
}
.hp-nav-btn:hover { color: #93c5fd !important; background: rgba(59,130,246,0.07) !important; }
`;

// ─── Feature data ──────────────────────────────────────────────────────────
interface Feature {
  icon:   string;
  title:  string;
  desc:   string;
  badge:  string;
  accent: string;
  cardCls: string;
  page:   BrainState['appPage'];
  cta:    string;
}

const FEATURES: Feature[] = [
  {
    icon: '🧠', title: '3D Brain Explorer',
    desc: 'Navigate a fully segmented 141-region Allen Atlas model. Isolate, explode, layer, and cross-section any anatomical structure in real time.',
    badge: 'Live', accent: '#3b82f6', cardCls: 'hp-card hp-card-blue',
    page: 'explorer', cta: 'Open Explorer →',
  },
  {
    icon: '📚', title: 'Research Engine',
    desc: 'Import papers via PubMed or DOI. Link sources to brain regions, fetch abstracts, and export citations in APA, MLA, Vancouver, or BibTeX.',
    badge: 'Live', accent: '#8b5cf6', cardCls: 'hp-card hp-card-purple',
    page: 'library', cta: 'Open Library →',
  },
  {
    icon: '🌐', title: 'Community Atlas',
    desc: 'Share verified region–source links with the global neuroscience community. Collaborate on annotating the human brain with peer-reviewed evidence.',
    badge: 'Live', accent: '#22d3ee', cardCls: 'hp-card hp-card-cyan',
    page: 'community', cta: 'View Atlas →',
  },
];

const MARQUEE = [
  'Prefrontal Cortex','Hippocampus','Amygdala','Thalamus','Cerebellum',
  'Basal Ganglia','Corpus Callosum','Insula','Cingulate Cortex','Putamen',
  'Caudate Nucleus','Substantia Nigra','Locus Coeruleus','Claustrum',
  'Entorhinal Cortex','Parahippocampal Gyrus','Superior Temporal Gyrus',
  'Fusiform Gyrus','Angular Gyrus','Precuneus',
];

// ─── Component ─────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { setAppPage, sources, structureLinks, user } = useBrainStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Neural-network canvas animation ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Neuron = {
      x: number; y: number; vx: number; vy: number;
      r: number; baseAlpha: number; pulsePhase: number; color: string;
    };
    type Pulse = { fi: number; ti: number; t: number; speed: number; };

    const COLORS = ['#3b82f6','#22d3ee','#8b5cf6','#60a5fa','#0ea5e9','#a78bfa'];
    const neurons: Neuron[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r:  Math.random() * 1.9 + 0.4,
      baseAlpha:  Math.random() * 0.45 + 0.12,
      pulsePhase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const pulses: Pulse[] = [];
    let lastPulse = 0;
    const MAX_DIST = 145;

    const draw = (ts: number) => {
      const t = ts * 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connection lines
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[j].x - neurons[i].x;
          const dy = neurons[j].y - neurons[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < MAX_DIST) {
            const a = (1 - dist / MAX_DIST) * 0.09;
            ctx.beginPath();
            ctx.moveTo(neurons[i].x, neurons[i].y);
            ctx.lineTo(neurons[j].x, neurons[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Travelling pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const from = neurons[p.fi];
        const to   = neurons[p.ti];
        const px = from.x + (to.x - from.x) * p.t;
        const py = from.y + (to.y - from.y) * p.t;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, 'rgba(34,211,238,0.95)');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Spawn pulse
      if (t - lastPulse > 0.28) {
        lastPulse = t;
        const fi = Math.floor(Math.random() * neurons.length);
        let bestJ = -1, bestD = MAX_DIST;
        for (let j = 0; j < neurons.length; j++) {
          if (j === fi) continue;
          const d = Math.hypot(neurons[j].x - neurons[fi].x, neurons[j].y - neurons[fi].y);
          if (d < bestD && Math.random() > 0.38) { bestD = d; bestJ = j; }
        }
        if (bestJ >= 0) pulses.push({ fi, ti: bestJ, t: 0, speed: 0.006 + Math.random() * 0.008 });
      }

      // Draw neurons
      for (const n of neurons) {
        const alpha = n.baseAlpha + Math.sin(t * 1.7 + n.pulsePhase) * 0.08;

        // Soft halo
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        glow.addColorStop(0, n.color + '44');
        glow.addColorStop(1, n.color + '00');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = Math.min(alpha + 0.15, 1);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Drift
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = canvas.width  + 10;
        if (n.x > canvas.width  + 10) n.x = -10;
        if (n.y < -10) n.y = canvas.height + 10;
        if (n.y > canvas.height + 10) n.y = -10;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: '#050b18',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      <style>{STYLES}</style>

      {/* Neural canvas — fixed behind everything */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />

      {/* ── Ambient background orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-18%', left: '-12%',
          width: 750, height: 750, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'floatA 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-22%', right: '-8%',
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,0.14) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'floatB 26s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '20%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'floatC 18s ease-in-out infinite',
        }} />
      </div>

      {/* ════════ HEADER ════════ */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 44px',
        borderBottom: '1px solid rgba(59,130,246,0.09)',
        background: 'rgba(5,11,24,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
            boxShadow: '0 0 24px rgba(59,130,246,0.55), 0 0 48px rgba(59,130,246,0.18)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 5, left: 6, width: 13, height: 9,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.38)',
              transform: 'rotate(-20deg)',
            }} />
          </div>
          <div>
            <div style={{
              fontWeight: 800, fontSize: 16, letterSpacing: 3.5, color: '#e2eaff',
              textShadow: '0 0 28px rgba(59,130,246,0.45)',
            }}>MAPPED</div>
            <div style={{
              fontSize: 8.5, color: '#2d3f58', letterSpacing: 2,
              textTransform: 'uppercase', fontWeight: 500, marginTop: 1,
            }}>3D Brain Research Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['explorer','library','community'] as const).map((page) => (
            <button
              key={page}
              className="hp-nav-btn"
              onClick={() => setAppPage(page)}
              style={{
                padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', background: 'transparent', border: 'none',
                color: '#4d6080', textTransform: 'capitalize',
              }}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: 'rgba(59,130,246,0.18)', margin: '0 6px' }} />
          {user ? (
            <button
              className="hp-nav-btn"
              onClick={() => setAppPage('auth')}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.28)', color: '#60a5fa',
              }}
            >
              {user.email.split('@')[0]}
            </button>
          ) : (
            <button
              onClick={() => setAppPage('auth')}
              style={{
                padding: '7px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.22))',
                border: '1px solid rgba(59,130,246,0.38)', color: '#60a5fa',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* ════════ HERO ════════ */}
      <section style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: '100px 24px 80px',
        minHeight: '82vh',
        justifyContent: 'center',
      }}>

        {/* ── Brain orb — sits behind hero text ── */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 560, height: 560,
          pointerEvents: 'none', zIndex: 0,
        }}>
          {/* Expanding pulse rings */}
          {[0, 1.4, 2.8].map((delay, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '100%', height: '100%', borderRadius: '50%',
              border: `1px solid rgba(59,130,246,${0.18 - i * 0.04})`,
              animation: `ringPulse 4s ease-out ${delay}s infinite`,
            }} />
          ))}

          {/* Outer dashed orbit */}
          <div style={{
            position: 'absolute', inset: -24, borderRadius: '50%',
            border: '1px dashed rgba(59,130,246,0.16)',
            animation: 'orbRotate 35s linear infinite',
          }} />
          {/* Dot on outer orbit */}
          <div style={{
            position: 'absolute',
            top: -24 + 280 - 4, left: '50%', marginLeft: -4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#3b82f6',
            boxShadow: '0 0 12px #3b82f6',
            transformOrigin: `4px ${24 + 280}px`,
            animation: 'orbRotate 35s linear infinite',
          }} />

          {/* Inner counter-rotating ring */}
          <div style={{
            position: 'absolute', inset: 50, borderRadius: '50%',
            border: '1px dashed rgba(139,92,246,0.14)',
            animation: 'orbRotateRev 22s linear infinite',
          }} />

          {/* Mid glow layer */}
          <div style={{
            position: 'absolute', inset: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
            animation: 'brainPulse 5.5s ease-in-out infinite',
          }} />

          {/* Core glow */}
          <div style={{
            position: 'absolute', inset: 165, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.7) 0%, rgba(59,130,246,0.3) 45%, transparent 70%)',
            boxShadow: '0 0 90px rgba(59,130,246,0.3), 0 0 50px rgba(34,211,238,0.18)',
            animation: 'brainPulse 5.5s ease-in-out infinite 1.2s',
          }} />

          {/* Very inner hot spot */}
          <div style={{
            position: 'absolute', inset: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(186,230,253,0.8) 0%, rgba(96,165,250,0.4) 60%, transparent)',
            animation: 'brainPulse 5.5s ease-in-out infinite 0.6s',
          }} />
        </div>

        {/* ── Hero content (above orb) ── */}
        <div style={{ position: 'relative', zIndex: 2, animation: 'fadeInUp 0.9s cubic-bezier(.16,1,.3,1) both' }}>

          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '5px 18px', borderRadius: 20, marginBottom: 36,
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.22)',
            fontSize: 11, fontWeight: 600, color: '#60a5fa',
            letterSpacing: 1.6, textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: '#22d3ee', boxShadow: '0 0 10px #22d3ee',
              animation: 'dotPulse 2.2s ease-in-out infinite',
            }} />
            Alpha · Allen Human Reference Atlas · 141 Regions
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(38px, 5.8vw, 68px)',
            fontWeight: 900, color: '#f0f6ff',
            margin: '0 0 26px', lineHeight: 1.08,
            maxWidth: 780, letterSpacing: -2,
          }}>
            Explore the Human Brain<br />
            <span style={{
              background: 'linear-gradient(95deg, #60a5fa 0%, #22d3ee 35%, #a78bfa 65%, #60a5fa 100%)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 6s linear infinite',
            }}>
              in Three Dimensions
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 17, color: '#3d5068', maxWidth: 600,
            lineHeight: 1.78, margin: '0 auto 50px', fontWeight: 400,
          }}>
            Multilayer Anatomical Platform for Personalized Exploration & Discovery.
            Link peer-reviewed research directly to neuroanatomical structures.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 68 }}>
            <button
              className="hp-btn-primary"
              onClick={() => setAppPage('explorer')}
              style={{
                padding: '15px 36px', borderRadius: 11, fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', color: '#fff',
                boxShadow: '0 0 32px rgba(59,130,246,0.45)',
                letterSpacing: 0.2,
              }}
            >
              Open Brain Explorer →
            </button>
            <button
              className="hp-btn-secondary"
              onClick={() => setAppPage('library')}
              style={{
                padding: '15px 36px', borderRadius: 11, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(59,130,246,0.04)',
                border: '1px solid rgba(59,130,246,0.28)', color: '#60a5fa',
              }}
            >
              View Research Library
            </button>
          </div>

          {/* Stats glass panel */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(8,16,36,0.65)',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 16,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            overflow: 'hidden',
          }}>
            {[
              { label: 'Brain Regions',  value: '141'                          },
              { label: 'Sources',        value: String(sources.length)          },
              { label: 'Region Links',   value: String(structureLinks.length)   },
              { label: 'Atlas Version',  value: '2020'                          },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                padding: '22px 34px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(59,130,246,0.07)' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 9.5, color: '#233049', letterSpacing: 1.3,
                  textTransform: 'uppercase', marginTop: 7, fontWeight: 600,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section style={{
        position: 'relative', zIndex: 10,
        padding: '20px 44px 88px',
        maxWidth: 1160, margin: '0 auto', width: '100%',
      }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#1e3048', marginBottom: 12,
          }}>
            Platform Capabilities
          </div>
          <div style={{
            fontSize: 26, fontWeight: 700, color: '#c8d8f0', letterSpacing: -0.6,
          }}>
            Everything you need for neuroscience research
          </div>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: 22,
        }}>
          {FEATURES.map((f) => (
            <button
              key={f.title}
              className={f.cardCls}
              onClick={() => setAppPage(f.page)}
              style={{
                background: 'rgba(8,15,32,0.8)',
                border: `1px solid rgba(59,130,246,0.1)`,
                borderRadius: 18, padding: 0,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                cursor: 'pointer', textAlign: 'left',
                overflow: 'hidden',
                boxShadow: '0 4px 28px rgba(0,0,0,0.35)',
              }}
            >
              {/* Coloured gradient top bar */}
              <div style={{
                height: 2,
                background: `linear-gradient(90deg, ${f.accent} 0%, ${f.accent}00 100%)`,
              }} />

              {/* Very subtle inner glow at top */}
              <div style={{
                height: 60,
                background: `linear-gradient(to bottom, ${f.accent}0d 0%, transparent 100%)`,
                marginTop: -2,
              }} />

              <div style={{ padding: '4px 28px 28px' }}>
                {/* Icon + badge */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', marginBottom: 22,
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 13,
                    background: `${f.accent}15`,
                    border: `1px solid ${f.accent}2a`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    {f.icon}
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1.6,
                    textTransform: 'uppercase', color: f.accent,
                    background: `${f.accent}14`,
                    border: `1px solid ${f.accent}28`,
                    padding: '3px 11px', borderRadius: 20,
                    marginTop: 4,
                  }}>
                    {f.badge}
                  </span>
                </div>

                <div style={{
                  fontSize: 17, fontWeight: 700, color: '#e8f0ff',
                  marginBottom: 12, letterSpacing: -0.4,
                }}>
                  {f.title}
                </div>

                <p style={{
                  fontSize: 13.5, color: '#334155', lineHeight: 1.78,
                  margin: '0 0 22px',
                }}>
                  {f.desc}
                </p>

                <div style={{
                  fontSize: 13, fontWeight: 600, color: f.accent,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {f.cta}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ════════ MARQUEE STRIP ════════ */}
      <div style={{
        position: 'relative', zIndex: 10,
        overflow: 'hidden',
        borderTop: '1px solid rgba(20,36,60,0.7)',
        borderBottom: '1px solid rgba(20,36,60,0.7)',
        padding: '13px 0',
        background: 'rgba(4,9,20,0.5)',
      }}>
        <div style={{
          display: 'flex', gap: 52,
          animation: 'marquee 36s linear infinite',
          width: 'max-content',
        }}>
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <div key={i} style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: 1.8,
              textTransform: 'uppercase', color: '#16263e',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{
                width: 3, height: 3, borderRadius: '50%',
                background: '#1a3456', display: 'inline-block', flexShrink: 0,
              }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ════════ FOOTER ════════ */}
      <footer style={{
        position: 'relative', zIndex: 10,
        padding: '22px 44px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(20,34,56,0.5)',
        background: 'rgba(4,9,20,0.4)',
      }}>
        <span style={{ fontSize: 11, color: '#1e3048', fontWeight: 500 }}>
          MAPPED · Alpha · Allen Human Reference Atlas 3D
        </span>
        <div style={{ display: 'flex', gap: 28 }}>
          {(['explorer','library','community'] as const).map((page) => (
            <button
              key={page}
              onClick={() => setAppPage(page)}
              style={{
                fontSize: 11, color: '#1e3048', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#1e3048'; }}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#1e3048' }}>© 2026</span>
      </footer>
    </div>
  );
};

export default HomePage;
