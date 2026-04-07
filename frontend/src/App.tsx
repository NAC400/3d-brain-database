import React, { useEffect } from 'react';
import BrainScene from './components/BrainScene';
import RegionInfoPanel from './components/RegionInfoPanel';
import ControlsToolbar from './components/ControlsToolbar';
import RegionSearch from './components/RegionSearch';
import ResearchPanel from './components/ResearchPanel';
import SourceViewer from './components/SourceViewer';
import HomePage from './components/HomePage';
import LibraryPage from './components/LibraryPage';
import ContextMenu from './components/ContextMenu';
import ProjectsModal from './components/ProjectsModal';
import { useBrainStore } from './store/brainStore';

const LazyGlobalAtlasPage = React.lazy(() => import('./components/GlobalAtlasPage'));
const LazyAuthPage        = React.lazy(() => import('./components/AuthPage'));

const App: React.FC = () => {
  const {
    appPage, setAppPage,
    researchPanelOpen, setResearchPanelOpen,
    sources, structureLinks,
    setSelectedRegion, setExplodeAmount, explodeAmount,
    highlightMode, setHighlightMode, clearAllHighlights,
    selectedRegion,
    projects, activeProjectId, setActiveProjectId,
    explorerMode, setExplorerMode,
  } = useBrainStore();

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key.toLowerCase()) {
        case 'r': useBrainStore.getState().setCameraTarget({ position: [0, 0, 4.5], lookAt: [0, 0, 0] }); break;
        case 'e': setExplodeAmount(explodeAmount > 0 ? 0 : 0.5); break;
        case 'l': setResearchPanelOpen(!researchPanelOpen); break;
        case 's': document.querySelector<HTMLInputElement>('input[placeholder*="Search brain"]')?.focus(); break;
        case 'h': setHighlightMode(!useBrainStore.getState().highlightMode); break;
        case 'escape':
          setSelectedRegion(null);
          useBrainStore.getState().setIsolatedRegion(null);
          if (useBrainStore.getState().highlightMode) setHighlightMode(false);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [explodeAmount, researchPanelOpen, setExplodeAmount, setResearchPanelOpen, setSelectedRegion, setHighlightMode]);

  const [projectDropOpen, setProjectDropOpen] = React.useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = React.useState(false);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const selectedRegionSourceCount = React.useMemo(() => {
    if (!selectedRegion) return 0;
    const ids = new Set(structureLinks.filter((l) => l.regionMeshName === selectedRegion).map((l) => l.sourceId));
    return sources.filter((s) => ids.has(s.id)).length;
  }, [selectedRegion, structureLinks, sources]);

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

        {/* Explorer mode toggle + Research panel toggle — only in explorer */}
        {appPage === 'explorer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Personal / Community toggle */}
            <div style={{
              display: 'flex', borderRadius: 6, overflow: 'hidden',
              border: '1px solid rgba(59,130,246,0.3)',
            }}>
              {(['personal', 'community'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setExplorerMode(m)}
                  title={m === 'personal' ? 'Your personal sources & notes' : 'Community-verified sources from the global atlas'}
                  style={{
                    padding: '5px 12px', fontSize: 11, fontWeight: explorerMode === m ? 700 : 400, cursor: 'pointer',
                    border: 'none',
                    background: explorerMode === m
                      ? m === 'community' ? 'rgba(34,211,238,0.2)' : 'rgba(59,130,246,0.2)'
                      : 'transparent',
                    color: explorerMode === m
                      ? m === 'community' ? '#22d3ee' : '#60a5fa'
                      : '#64748b',
                  }}
                >
                  {m === 'personal' ? 'Personal' : 'Community'}
                </button>
              ))}
            </div>

            {/* Research panel button */}
            <button
              onClick={() => setResearchPanelOpen(!researchPanelOpen)}
              title="Toggle Research Panel (L)"
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${researchPanelOpen ? 'rgba(59,130,246,0.5)' : 'rgba(100,116,139,0.25)'}`,
                background: researchPanelOpen ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: researchPanelOpen ? '#60a5fa' : '#94a3b8',
                fontWeight: researchPanelOpen ? 700 : 400,
              }}
            >
              Research{selectedRegionSourceCount > 0 ? ` (${selectedRegionSourceCount})` : ''}
            </button>
          </div>
        )}

        {/* Library title */}
        {appPage === 'library' && (
          <div style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>
            {sources.length} source{sources.length !== 1 ? 's' : ''}
            {structureLinks.length > 0 && ` · ${structureLinks.length} link${structureLinks.length !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Project selector — visible in explorer + library */}
        {(appPage === 'explorer' || appPage === 'library') && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setProjectDropOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${activeProject ? activeProject.color + '55' : 'rgba(100,116,139,0.25)'}`,
                background: activeProject ? activeProject.color + '18' : 'transparent',
                color: activeProject ? activeProject.color : '#64748b',
                fontWeight: activeProject ? 600 : 400,
              }}
            >
              {activeProject
                ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: activeProject.color, flexShrink: 0 }} />{activeProject.name}</>
                : 'All Projects'
              }
              <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
            </button>
            {projectDropOpen && (
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 200,
                  minWidth: 200, background: 'rgba(15,23,42,0.98)',
                  border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
                }}
                onMouseLeave={() => setProjectDropOpen(false)}
              >
                <button
                  onClick={() => { setActiveProjectId(null); setProjectDropOpen(false); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, background: !activeProjectId ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', color: !activeProjectId ? '#60a5fa' : '#94a3b8', cursor: 'pointer', fontWeight: !activeProjectId ? 700 : 400 }}
                >
                  All Projects
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveProjectId(p.id); setProjectDropOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, background: activeProjectId === p.id ? 'rgba(59,130,246,0.08)' : 'transparent', border: 'none', color: activeProjectId === p.id ? '#f1f5f9' : '#94a3b8', cursor: 'pointer', fontWeight: activeProjectId === p.id ? 600 : 400 }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: p.mode === 'community' ? '#22d3ee' : '#6366f1', opacity: 0.8 }}>
                      {p.mode === 'community' ? 'Community' : 'Private'}
                    </span>
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }} />
                <button
                  onClick={() => { setProjectDropOpen(false); setProjectsModalOpen(true); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Manage Projects
                </button>
              </div>
            )}
          </div>
        )}

        {/* Nav — top-level pages only, no page-specific controls here */}
        <nav style={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>

          {(['explorer', 'library', 'community'] as const).map((page) => (
            <button
              key={page}
              onClick={() => setAppPage(page)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${appPage === page ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
                background: appPage === page ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: appPage === page ? '#60a5fa' : '#94a3b8',
                fontWeight: appPage === page ? 700 : 400,
                textTransform: 'capitalize',
              }}
            >
              {page}
            </button>
          ))}

          <div style={{ width: 1, height: 18, background: 'rgba(30,64,175,0.4)', margin: '0 6px' }} />

          {/* Account button — shows username when signed in */}
          {useBrainStore.getState().user ? (
            <button
              onClick={() => setAppPage('auth')}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: '1px solid rgba(59,130,246,0.35)',
                background: 'rgba(59,130,246,0.12)',
                color: '#60a5fa', fontWeight: 600,
              }}
            >
              {useBrainStore.getState().user!.email.split('@')[0]}
            </button>
          ) : (
            <button
              onClick={() => setAppPage('auth')}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa', fontWeight: 700,
              }}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* ── Page content ── */}
      {appPage === 'explorer' && (
        <div style={{ display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* 3-D viewport */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            outline: highlightMode ? '2px solid rgba(34,211,238,0.6)' : 'none',
            outlineOffset: '-2px',
          }}>
            <BrainScene />
            <RegionInfoPanel />

            {/* Paint mode active badge */}
            {highlightMode && (
              <div style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 50, display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', borderRadius: 20,
                background: 'rgba(6,182,212,0.15)',
                border: '1px solid rgba(34,211,238,0.6)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 20px rgba(34,211,238,0.2)',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: 14 }}>🖌</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', letterSpacing: 0.5 }}>
                  PAINT MODE
                </span>
                <span style={{ fontSize: 11, color: '#0891b2' }}>
                  — click any region to apply colour
                </span>
              </div>
            )}

            {/* Paint mode action buttons — bottom-left corner */}
            {highlightMode && (
              <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 50, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => clearAllHighlights()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Clear All Highlights
                </button>
                <button
                  onClick={() => setHighlightMode(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    background: 'rgba(6,182,212,0.15)',
                    border: '1px solid rgba(34,211,238,0.5)',
                    color: '#22d3ee', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  ✕ Exit Paint Mode
                </button>
              </div>
            )}
          </div>
          {/* Research sidebar */}
          <ResearchPanel />
        </div>
      )}

      {appPage === 'library' && <LibraryPage />}

      {(appPage === 'community' || appPage === 'auth') && (
        <React.Suspense fallback={<div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>Loading…</div>}>
          {appPage === 'community' && <LazyGlobalAtlasPage />}
          {appPage === 'auth' && <LazyAuthPage />}
        </React.Suspense>
      )}

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

      {/* Right-click context menu — rendered at document level */}
      <ContextMenu />

      {/* Projects modal */}
      {projectsModalOpen && <ProjectsModal onClose={() => setProjectsModalOpen(false)} />}
    </div>
  );
};

export default App;
