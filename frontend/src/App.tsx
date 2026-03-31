import React from 'react';
import BrainScene from './components/BrainScene';
import RegionInfoPanel from './components/RegionInfoPanel';
import ControlsToolbar from './components/ControlsToolbar';
import RegionSearch from './components/RegionSearch';
import ResearchPanel from './components/ResearchPanel';
import SourceViewer from './components/SourceViewer';
import HomePage from './components/HomePage';
import LibraryPage from './components/LibraryPage';
import { useBrainStore } from './store/brainStore';

const App: React.FC = () => {
  const {
    appPage, setAppPage,
    researchPanelOpen, setResearchPanelOpen,
    sources, structureLinks,
  } = useBrainStore();

  // ── Home page — full screen, no app chrome ──
  if (appPage === 'home') {
    return (
      <>
        <HomePage />
        {/* SourceViewer can still open from home if navigated from a deep link */}
        <SourceViewer />
      </>
    );
  }

  // ── Explorer / Library — shared app shell ──
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
    }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: '1px solid rgba(30,64,175,0.6)',
        background: 'rgba(15,23,42,0.97)',
        zIndex: 40, gap: 16,
      }}>

        {/* Logo — clicking returns to home */}
        <button
          onClick={() => setAppPage('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#1e40af)',
            boxShadow: '0 0 10px rgba(59,130,246,0.5)',
            flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 2, color: '#e0eaff' }}>MAPPED</div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1 }}>3D BRAIN RESEARCH PLATFORM</div>
          </div>
        </button>

        {/* Region search — only in explorer */}
        {appPage === 'explorer' && (
          <div style={{ flex: 1, maxWidth: 360 }}>
            <RegionSearch />
          </div>
        )}

        {/* Library title placeholder to keep layout balanced */}
        {appPage === 'library' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>📚</span>
            Research Library
            <span style={{ fontSize: 11, color: '#334155' }}>
              · {sources.length} source{sources.length !== 1 ? 's' : ''}, {structureLinks.length} link{structureLinks.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Nav tabs + Research toggle */}
        <nav style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>

          {/* Page tabs */}
          <button
            onClick={() => setAppPage('explorer')}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${appPage === 'explorer' ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
              background: appPage === 'explorer' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: appPage === 'explorer' ? '#60a5fa' : '#94a3b8',
              fontWeight: appPage === 'explorer' ? 700 : 400,
            }}
          >
            Explorer
          </button>
          <button
            onClick={() => setAppPage('library')}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${appPage === 'library' ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
              background: appPage === 'library' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: appPage === 'library' ? '#60a5fa' : '#94a3b8',
              fontWeight: appPage === 'library' ? 700 : 400,
            }}
          >
            Library
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(30,64,175,0.4)', margin: '0 4px' }} />

          {/* Research sidebar toggle — only relevant in explorer */}
          {appPage === 'explorer' && (
            <button
              onClick={() => setResearchPanelOpen(!researchPanelOpen)}
              title="Toggle research sources panel"
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${researchPanelOpen ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
                background: researchPanelOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: researchPanelOpen ? '#60a5fa' : '#94a3b8',
              }}
            >
              Sources
            </button>
          )}

          <button style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'not-allowed', border: 'none', background: 'transparent', color: '#334155' }}>
            Community
          </button>
        </nav>
      </header>

      {/* ── Page content ── */}
      {appPage === 'explorer' && (
        <div style={{ display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* 3-D viewport */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <BrainScene />
            <RegionInfoPanel />
          </div>
          {/* Research sidebar */}
          <ResearchPanel />
        </div>
      )}

      {appPage === 'library' && <LibraryPage />}

      {/* ── Footer toolbar — only in explorer ── */}
      {appPage === 'explorer' && (
        <footer style={{
          display: 'flex', alignItems: 'center',
          padding: '0 24px', height: 44,
          borderTop: '1px solid rgba(30,64,175,0.4)',
          background: 'rgba(15,23,42,0.97)',
          zIndex: 40, overflow: 'hidden',
        }}>
          <ControlsToolbar />
        </footer>
      )}

      {/* Source detail viewer — full-screen overlay, works on any page */}
      <SourceViewer />
    </div>
  );
};

export default App;
