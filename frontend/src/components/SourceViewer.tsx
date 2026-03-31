import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { StructureLink } from '../store/brainStore';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const SourceViewer: React.FC = () => {
  const {
    viewingSourceId, setViewingSourceId,
    sources, structureLinks,
    regionMap, brainRegions,
    addStructureLink, removeStructureLink,
    setSelectedRegion, setCameraTarget, regionCentroids,
    removeSource,
  } = useBrainStore();

  const [regionSearch, setRegionSearch] = useState('');
  const [regionDropOpen, setRegionDropOpen] = useState(false);
  const [linkedRegion, setLinkedRegion] = useState('');

  const source = sources.find((s) => s.id === viewingSourceId);
  if (!source) return null;

  const linkedRegions = structureLinks.filter((l) => l.sourceId === source.id);

  const regionMatches = regionSearch.trim()
    ? brainRegions
        .filter(
          (r) =>
            r.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
            r.acronym.toLowerCase().includes(regionSearch.toLowerCase())
        )
        .filter((r) => !linkedRegions.find((l) => l.regionMeshName === r.meshName))
        .slice(0, 8)
    : [];

  const addLink = (meshName: string) => {
    const regionData = regionMap[meshName];
    if (!regionData) return;
    const link: StructureLink = {
      id: genId(),
      sourceId: source.id,
      regionMeshName: meshName,
      regionName: regionData.name,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    addStructureLink(link);
    setRegionSearch('');
    setLinkedRegion('');
    setRegionDropOpen(false);
  };

  const jumpToRegion = (meshName: string) => {
    setViewingSourceId(null);
    setSelectedRegion(meshName);
    const c = regionCentroids[meshName];
    if (c) {
      setCameraTarget({ position: [c[0], c[1], c[2] + 0.6], lookAt: [c[0], c[1], c[2]] });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Permanently remove this source?')) {
      removeSource(source.id);
      setViewingSourceId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(7,11,22,0.96)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(6px)',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px',
        borderBottom: '1px solid rgba(59,130,246,0.2)',
        background: 'rgba(15,23,42,0.98)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setViewingSourceId(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', color: '#60a5fa',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}
        >
          ← Back to Brain
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3b82f6', textTransform: 'uppercase' }}>
          Source Detail
        </div>

        {source.doi && (
          <a
            href={`https://doi.org/${source.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.45)',
              color: '#60a5fa', textDecoration: 'none', letterSpacing: 0.4,
            }}
          >
            Open Paper ↗
          </a>
        )}
        {!source.doi && <div style={{ width: 100 }} />}
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 760 }}>

          {/* Title */}
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#f1f5f9',
            lineHeight: 1.35, margin: '0 0 12px',
          }}>
            {source.title}
          </h1>

          {/* Authors / journal / year */}
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
            {source.authors.join(', ')}
            {source.journal && <span> · <em style={{ color: '#94a3b8' }}>{source.journal}</em></span>}
            {source.year && <span> · {source.year}</span>}
          </div>

          {/* Tags */}
          {source.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
              {source.tags.map((t) => (
                <span key={t} style={{
                  padding: '2px 9px', borderRadius: 4, fontSize: 11,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc',
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Abstract */}
          {source.abstract ? (
            <div style={{
              background: 'rgba(30,41,59,0.5)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 10, padding: '20px 24px', marginBottom: 28,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>
                Abstract
              </div>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.75, margin: 0 }}>
                {source.abstract}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(30,41,59,0.3)',
              border: '1px solid rgba(59,130,246,0.1)',
              borderRadius: 10, padding: '16px 24px', marginBottom: 28,
              fontSize: 12, color: '#334155', textAlign: 'center',
            }}>
              No abstract available
            </div>
          )}

          {/* IDs row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {source.doi && (
              <div style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 11,
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#64748b',
              }}>
                DOI: <span style={{ color: '#93c5fd', userSelect: 'all' }}>{source.doi}</span>
              </div>
            )}
            <div style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11,
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#64748b',
            }}>
              Added: <span style={{ color: '#94a3b8' }}>{new Date(source.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* ── Linked brain regions ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
              Linked Brain Regions
            </div>

            {linkedRegions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {linkedRegions.map((link) => (
                  <div key={link.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 6,
                    background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)',
                  }}>
                    <button
                      onClick={() => jumpToRegion(link.regionMeshName)}
                      style={{
                        background: 'none', border: 'none', color: '#22d3ee',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                      }}
                    >
                      {link.regionName}
                    </button>
                    <button
                      onClick={() => removeStructureLink(link.id)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 14 }}>
                No regions linked yet.
              </div>
            )}

            {/* Add region link */}
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <input
                value={regionSearch}
                onChange={(e) => { setRegionSearch(e.target.value); setLinkedRegion(''); setRegionDropOpen(true); }}
                onFocus={() => setRegionDropOpen(true)}
                placeholder="Link to a brain region…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '7px 12px', background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6,
                  color: '#e2e8f0', fontSize: 12, outline: 'none',
                }}
              />
              {linkedRegion && (
                <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 10, color: '#22d3ee' }}>
                  ✓ {regionMap[linkedRegion]?.name}
                </span>
              )}
              {regionDropOpen && regionMatches.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
                  background: '#0f172a', border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 6, zIndex: 10, maxHeight: 200, overflowY: 'auto',
                }}>
                  {regionMatches.map((r) => (
                    <div
                      key={r.meshName}
                      onClick={() => { addLink(r.meshName); setLinkedRegion(r.meshName); setRegionSearch(r.name); setRegionDropOpen(false); }}
                      style={{ padding: '7px 12px', fontSize: 11, color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {r.name} <span style={{ color: '#475569', fontSize: 9 }}>{r.acronym}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Danger zone ── */}
          <div style={{
            borderTop: '1px solid rgba(239,68,68,0.1)',
            paddingTop: 20, marginTop: 8,
          }}>
            <button
              onClick={handleDelete}
              style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', cursor: 'pointer',
              }}
            >
              Remove Source
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SourceViewer;
