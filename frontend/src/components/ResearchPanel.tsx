import React, { useState, useMemo } from 'react';
import { useBrainStore } from '../store/brainStore';
import SourceCard from './SourceCard';
import AddSourceModal from './AddSourceModal';

type Tab = 'region' | 'all' | 'search';

const ResearchPanel: React.FC = () => {
  const {
    selectedRegion, regionMap,
    sources, structureLinks,
    researchPanelOpen, setResearchPanelOpen,
    activeProjectId,
  } = useBrainStore();

  const [tab, setTab]               = useState<Tab>('region');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Sources linked to the currently selected region, filtered by active project
  const regionSources = useMemo(() => {
    if (!selectedRegion) return [];
    const ids = new Set(
      structureLinks
        .filter((l) => l.regionMeshName === selectedRegion)
        .map((l) => l.sourceId)
    );
    let filtered = sources.filter((s) => ids.has(s.id));
    if (activeProjectId) filtered = filtered.filter((s) => s.projectId === activeProjectId || !s.projectId);
    return filtered;
  }, [selectedRegion, sources, structureLinks, activeProjectId]);

  // All sources (sorted newest first), filtered by active project
  const allSources = useMemo(() => {
    const pool = activeProjectId
      ? sources.filter((s) => s.projectId === activeProjectId || !s.projectId)
      : sources;
    return [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sources, activeProjectId]);

  // Search results across title + authors + abstract + tags
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const pool = activeProjectId
      ? sources.filter((s) => s.projectId === activeProjectId || !s.projectId)
      : sources;
    return pool.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.authors.join(' ').toLowerCase().includes(q) ||
      (s.abstract ?? '').toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [sources, searchQuery, activeProjectId]);

  const selectedRegionData = selectedRegion ? regionMap[selectedRegion] : null;

  if (!researchPanelOpen) return null;

  return (
    <>
      <aside style={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15,23,42,0.97)',
        borderLeft: selectedRegionData
          ? `2px solid ${selectedRegionData.color}99`
          : '1px solid rgba(59,130,246,0.25)',
        boxShadow: selectedRegionData
          ? `inset 4px 0 16px ${selectedRegionData.color}14`
          : 'none',
        overflow: 'hidden',
        zIndex: 20,
      }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(30,41,59,0.8)',
          flexShrink: 0,
        }}>
          <div>
            {selectedRegionData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: selectedRegionData.color, flexShrink: 0,
                    boxShadow: `0 0 5px ${selectedRegionData.color}`,
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                    {selectedRegionData.name}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2, paddingLeft: 16 }}>
                  Research Sources · {sources.length} total
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#3b82f6', textTransform: 'uppercase' }}>
                  Research Sources
                </div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>
                  {sources.length} source{sources.length !== 1 ? 's' : ''} · {structureLinks.length} link{structureLinks.length !== 1 ? 's' : ''}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setAddModalOpen(true)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                color: '#60a5fa', cursor: 'pointer',
              }}
            >
              + Add
            </button>
            <button
              onClick={() => setResearchPanelOpen(false)}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', flexShrink: 0 }}>
          {([
            { id: 'region', label: selectedRegionData ? `Region (${regionSources.length})` : 'Region' },
            { id: 'search', label: 'Search' },
            { id: 'all',    label: `All (${sources.length})` },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '9px 4px', fontSize: 10, fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: tab === t.id ? '#60a5fa' : '#475569',
                borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                letterSpacing: 0.4,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

          {/* REGION TAB */}
          {tab === 'region' && (
            <>
              {selectedRegionData ? (
                <>
                  {/* Region info card */}
                  <div style={{
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedRegionData.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{selectedRegionData.name}</div>
                        <div style={{ fontSize: 9, color: '#475569' }}>{selectedRegionData.acronym} · {selectedRegionData.category}</div>
                      </div>
                    </div>
                    {selectedRegionData.parentName && (
                      <div style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>
                        Parent: <span style={{ color: '#64748b' }}>{selectedRegionData.parentName}</span>
                      </div>
                    )}
                  </div>

                  {regionSources.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 12, color: '#334155' }}>No sources linked to this region yet.</div>
                      <button
                        onClick={() => setAddModalOpen(true)}
                        style={{
                          marginTop: 12, padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                          color: '#60a5fa', cursor: 'pointer',
                        }}
                      >
                        + Add a source
                      </button>
                    </div>
                  ) : (
                    regionSources.map((s) => (
                      <SourceCard
                        key={s.id}
                        source={s}
                        linkedRegions={structureLinks.filter((l) => l.sourceId === s.id)}
                      />
                    ))
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#334155', fontSize: 12 }}>
                  Click a brain region to see linked research sources.
                </div>
              )}
            </>
          )}

          {/* SEARCH TAB */}
          {tab === 'search' && (
            <>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, keyword…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 12px', marginBottom: 12,
                  background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none',
                }}
              />
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <SourceCard
                      key={s.id}
                      source={s}
                      linkedRegions={structureLinks.filter((l) => l.sourceId === s.id)}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#334155', fontSize: 12, padding: '24px 0' }}>
                    No sources match "{searchQuery}"
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#334155', fontSize: 12, padding: '24px 0' }}>
                  Type to search your sources.
                </div>
              )}
            </>
          )}

          {/* ALL SOURCES TAB */}
          {tab === 'all' && (
            allSources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#334155', fontSize: 12 }}>
                No sources yet. Click <strong style={{ color: '#60a5fa' }}>+ Add</strong> to import from PubMed or add manually.
              </div>
            ) : (
              allSources.map((s) => (
                <SourceCard
                  key={s.id}
                  source={s}
                  linkedRegions={structureLinks.filter((l) => l.sourceId === s.id)}
                />
              ))
            )
          )}
        </div>
      </aside>

      {addModalOpen && (
        <AddSourceModal
          onClose={() => setAddModalOpen(false)}
          prelinkedRegion={selectedRegion ?? undefined}
        />
      )}
    </>
  );
};

export default ResearchPanel;
