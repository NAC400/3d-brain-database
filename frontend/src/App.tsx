import React from 'react';
import BrainScene from './components/BrainScene';
import RegionInfoPanel from './components/RegionInfoPanel';
import ControlsToolbar from './components/ControlsToolbar';
import RegionSearch from './components/RegionSearch';
import ResearchPanel from './components/ResearchPanel';
import SourceViewer from './components/SourceViewer';
import { useBrainStore } from './store/brainStore';

const App: React.FC = () => {
  const { researchPanelOpen, setResearchPanelOpen } = useBrainStore();

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
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
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

        {/* Region search bar — centre of header */}
        <div style={{ flex: 1, maxWidth: 360 }}>
          <RegionSearch />
        </div>

        <nav style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {(['Explore', 'Community'] as const).map((label) => (
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
          <button
            onClick={() => setResearchPanelOpen(!researchPanelOpen)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${researchPanelOpen ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
              background: researchPanelOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: researchPanelOpen ? '#60a5fa' : '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Research
          </button>
        </nav>
      </header>

      {/* ── Canvas area ── */}
      <div style={{ display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* 3-D viewport */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <BrainScene />
          {/* Region info panel (overlaid, right side of viewport) */}
          <RegionInfoPanel />
        </div>

        {/* Research sidebar */}
        <ResearchPanel />
      </div>

      {/* Source detail viewer — full-screen overlay */}
      <SourceViewer />

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
