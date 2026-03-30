import React from 'react';
import BrainScene from './components/BrainScene';
import RegionInfoPanel from './components/RegionInfoPanel';
import ControlsToolbar from './components/ControlsToolbar';
import { useBrainStore } from './store/brainStore';

const App: React.FC = () => {
  const { sourcePanel, setSourcePanelOpen } = useBrainStore();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          borderBottom: '1px solid rgba(30,64,175,0.6)',
          background: 'rgba(15,23,42,0.97)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
            boxShadow: '0 0 10px rgba(59,130,246,0.5)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2, color: '#e0eaff' }}>
              MAPPED
            </div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>
              3D BRAIN RESEARCH PLATFORM
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {['Explore', 'Research', 'Community'].map((label) => (
            <button
              key={label}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                (e.target as HTMLButtonElement).style.color = '#e0eaff';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'transparent';
                (e.target as HTMLButtonElement).style.color = '#94a3b8';
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Canvas area ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <BrainScene />

        {/* Sources toggle button */}
        {!sourcePanel.isOpen && (
          <button
            onClick={() => setSourcePanelOpen(true)}
            style={{
              position: 'absolute', top: 16, left: 16, zIndex: 40,
              padding: '6px 14px', fontSize: 12,
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(59,130,246,0.5)',
              borderRadius: 8, color: '#3b82f6',
              cursor: 'pointer',
              boxShadow: '0 0 8px rgba(59,130,246,0.2)',
            }}
          >
            Sources
          </button>
        )}

        {/* Sources sidebar */}
        {sourcePanel.isOpen && (
          <aside
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 30,
              width: 300,
              background: 'rgba(15,23,42,0.9)',
              borderRight: '1px solid rgba(59,130,246,0.3)',
              backdropFilter: 'blur(10px)',
              padding: 20,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: '#3b82f6', textTransform: 'uppercase' }}>
                Research Sources
              </span>
              <button
                onClick={() => setSourcePanelOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#475569' }}>Source panel — coming soon.</p>
          </aside>
        )}

        {/* Region info panel (right side, appears on click) */}
        <RegionInfoPanel />
      </div>

      {/* ── Footer / Controls Toolbar ── */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          height: 44,
          borderTop: '1px solid rgba(30,64,175,0.4)',
          background: 'rgba(15,23,42,0.97)',
          zIndex: 40,
          overflow: 'hidden',
        }}
      >
        <ControlsToolbar />
      </footer>
    </div>
  );
};

export default App;
