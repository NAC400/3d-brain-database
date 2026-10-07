import React, { useState, useMemo, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import SourceCard from './SourceCard';
import AddSourceModal from './AddSourceModal';
import ResearchProjects from './ResearchProjects';
import DeleteEngagementButton from './DeleteEngagementButton';
import {
  fetchContributionsByRegion,
  fetchGlobalContributions,
  isSupabaseConfigured,
  type GlobalContribution,
  deleteOwnEngagement,
} from '../lib/supabase';

type Tab = 'region' | 'all' | 'search' | 'projects';

// ---------------------------------------------------------------------------
// Community contribution card (replaces SourceCard in community mode)
// ---------------------------------------------------------------------------

const ContribCard: React.FC<{ contrib: GlobalContribution; onRemove: (id: string) => void }> = ({ contrib, onRemove }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(34,211,238,0.06)' : 'var(--product-surface)',
        border: `1px solid ${hovered ? 'rgba(34,211,238,0.3)' : 'rgba(34,211,238,0.12)'}`,
        borderRadius: 8, padding: '10px 12px', marginBottom: 8,
        transition: 'all 0.12s',
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: 'var(--product-text)',
        marginBottom: 3, lineHeight: 1.4,
      }}>
        {contrib.title}
      </div>

      {/* Authors · journal · year */}
      <div style={{ fontSize: 12, color: 'var(--product-muted)', marginBottom: 6 }}>
        {contrib.authors}
        {contrib.journal && <span> · <em>{contrib.journal}</em></span>}
        {contrib.year && <span> · {contrib.year}</span>}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <DeleteEngagementButton ownerId={contrib.user_id} label={`Delete contribution: ${contrib.title}`} confirmation="Remove this community contribution permanently?" onDelete={async () => {
          await deleteOwnEngagement('global_contributions', contrib.id);
          onRemove(contrib.id);
        }} />
        {contrib.verified && (
          <span style={{
            padding: '1px 6px', borderRadius: 3, fontSize: 12,
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
            color: '#22d3ee',
          }}>verified</span>
        )}
        {(contrib.ai_score ?? 0) > 0 && (
          <span style={{
            padding: '1px 6px', borderRadius: 3, fontSize: 12,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            color: '#a5b4fc',
          }}>score {contrib.ai_score}</span>
        )}
        {contrib.abstract && (
          <span style={{
            padding: '1px 6px', borderRadius: 3, fontSize: 12,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399',
          }}>abstract</span>
        )}
        {contrib.doi && (
          <a
            href={`https://doi.org/${contrib.doi}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 12,
              background: 'rgba(165,226,207,0.08)', border: '1px solid rgba(165,226,207,0.2)',
              color: 'var(--product-accent)', textDecoration: 'none',
            }}
          >DOI ↗</a>
        )}
      </div>

      {/* Abstract preview */}
      {contrib.abstract && (
        <div style={{
          marginTop: 6, fontSize: 12, color: 'var(--product-muted)',
          lineHeight: 1.5, display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {contrib.abstract}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const ResearchPanel: React.FC = () => {
  const {
    selectedRegion, regionMap,
    sources, structureLinks,
    researchPanelOpen, setResearchPanelOpen,
    activeProjectId,
    explorerMode,
  } = useBrainStore();

  const [tab, setTab]               = useState<Tab>('region');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // ── Community mode state ──
  const [communityRegion, setCommunityRegion]   = useState<GlobalContribution[]>([]);
  const [communityAll, setCommunityAll]         = useState<GlobalContribution[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [regionError, setRegionError] = useState(false);
  const [allError, setAllError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setTab(selectedRegion ? 'region' : 'projects');
    setSearchQuery('');
  }, [explorerMode, selectedRegion]);

  useEffect(() => { if (activeProjectId) setTab('projects'); }, [activeProjectId]);

  useEffect(() => {
    if (explorerMode !== 'community') return;
    let cancelled = false;
    setCommunityRegion([]);
    setRegionError(false);
    setRegionLoading(false);
    if (!selectedRegion || !isSupabaseConfigured()) return;
    setRegionLoading(true);
    fetchContributionsByRegion(selectedRegion, true)
      .then(data => { if (!cancelled) setCommunityRegion(data); })
      .catch(() => { if (!cancelled) setRegionError(true); })
      .finally(() => { if (!cancelled) setRegionLoading(false); });
    return () => { cancelled = true; };
  }, [explorerMode, selectedRegion, retry]);

  useEffect(() => {
    if (explorerMode !== 'community') return;
    let cancelled = false;
    setCommunityAll([]);
    setAllError(false);
    setAllLoading(false);
    if (!isSupabaseConfigured()) return;
    setAllLoading(true);
    fetchGlobalContributions(100, true)
      .then(data => { if (!cancelled) setCommunityAll(data); })
      .catch(() => { if (!cancelled) setAllError(true); })
      .finally(() => { if (!cancelled) setAllLoading(false); });
    return () => { cancelled = true; };
  }, [explorerMode, retry]);
  // Community search results
  const communitySearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return communityAll.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.authors.toLowerCase().includes(q) ||
      (c.abstract ?? '').toLowerCase().includes(q) ||
      c.region_name.toLowerCase().includes(q)
    );
  }, [communityAll, searchQuery]);

  // ── Personal mode state ──
  const regionSources = useMemo(() => {
    if (!selectedRegion) return [];
    const ids = new Set(
      structureLinks
        .filter((l) => l.regionMeshName === selectedRegion)
        .map((l) => l.sourceId)
    );
    let filtered = sources.filter((s) => ids.has(s.id));
    if (activeProjectId) filtered = filtered.filter((s) => s.projectId === activeProjectId);
    return filtered;
  }, [selectedRegion, sources, structureLinks, activeProjectId]);

  const allSources = useMemo(() => {
    const pool = activeProjectId
      ? sources.filter((s) => s.projectId === activeProjectId)
      : sources;
    return [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sources, activeProjectId]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const pool = activeProjectId
      ? sources.filter((s) => s.projectId === activeProjectId)
      : sources;
    return pool.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.authors.join(' ').toLowerCase().includes(q) ||
      (s.abstract ?? '').toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [sources, searchQuery, activeProjectId]);

  const selectedRegionData = selectedRegion ? regionMap[selectedRegion] : null;
  const isCommunity = explorerMode === 'community';
  const communityLoading = tab === 'region' ? regionLoading : allLoading;
  const communityError = tab === 'region' ? regionError : allError;

  if (!researchPanelOpen) return null;

  // ── Derived counts for tab labels ──
  const regionCount = isCommunity ? communityRegion.length : regionSources.length;
  const allCount    = isCommunity ? communityAll.length    : sources.length;
  const removeContribution = (id: string) => {
    setCommunityAll((items) => items.filter((c) => c.id !== id));
    setCommunityRegion((items) => items.filter((c) => c.id !== id));
  };

  return (
    <>
      <aside className="product-research-panel" aria-label="Research panel" style={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--product-surface)',
        borderLeft: isCommunity
          ? '2px solid rgba(34,211,238,0.35)'
          : selectedRegionData
            ? `2px solid ${selectedRegionData.color}99`
            : '1px solid rgba(165,226,207,0.25)',
        boxShadow: isCommunity
          ? 'inset 4px 0 16px rgba(34,211,238,0.06)'
          : selectedRegionData
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
            {isCommunity ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: '#22d3ee', flexShrink: 0,
                    boxShadow: '0 0 5px #22d3ee88',
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--product-text)' }}>
                    Community Atlas
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 2, paddingLeft: 16 }}>
                  {isSupabaseConfigured()
                    ? `${allCount} verified source${allCount !== 1 ? 's' : ''}`
                    : 'Community service unavailable'}
                </div>
              </>
            ) : selectedRegionData ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: selectedRegionData.color, flexShrink: 0,
                    boxShadow: `0 0 5px ${selectedRegionData.color}`,
                  }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--product-text)' }}>
                    {selectedRegionData.name}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 2, paddingLeft: 16 }}>
                  Research Sources · {sources.length} total
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: 'var(--product-accent)', textTransform: 'uppercase' }}>
                  Research Sources
                </div>
                <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 1 }}>
                  {sources.length} source{sources.length !== 1 ? 's' : ''} · {structureLinks.length} link{structureLinks.length !== 1 ? 's' : ''}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isCommunity && (
              <button
                onClick={() => setAddModalOpen(true)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'rgba(165,226,207,0.2)', border: '1px solid rgba(165,226,207,0.4)',
                  color: 'var(--product-accent)', cursor: 'pointer',
                }}
              >
                + Add
              </button>
            )}
            <button
              onClick={() => setResearchPanelOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--product-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', flexShrink: 0 }}>
          {([
            { id: 'projects', label: 'Projects' },
            { id: 'region', label: selectedRegionData ? `Region (${regionCount})` : 'Region' },
            { id: 'search', label: 'Search' },
            { id: 'all',    label: `All (${allCount})` },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: tab === t.id ? (isCommunity ? '#22d3ee' : 'var(--product-accent)') : 'var(--product-muted)',
                borderBottom: tab === t.id
                  ? `2px solid ${isCommunity ? '#22d3ee' : '#3b82f6'}`
                  : '2px solid transparent',
                letterSpacing: 0.4,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {tab === 'projects' && <ResearchProjects />}

          {/* ── COMMUNITY MODE ── */}
          {isCommunity && tab !== 'projects' && (
            <>
              <div className="research-feedback" role="status" aria-live="polite" aria-atomic="true">
                <strong>Community research</strong>
                <p>{!isSupabaseConfigured()
                  ? 'Community research is unavailable in this preview. Your personal workspace is still available.'
                  : communityLoading ? 'Loading shared research…'
                  : communityError ? 'We could not load community research. Please try again.'
                  : 'Viewing shared evidence. Your personal sources remain in Personal mode.'}</p>
                {communityError && <button onClick={() => setRetry(value => value + 1)}>Try again</button>}
              </div>

              {isSupabaseConfigured() && !communityError && !communityLoading && <>              {/* REGION TAB — community */}
              {tab === 'region' && (
                <>
                  {selectedRegionData ? (
                    <>
                      {/* Region info card */}
                      <div style={{
                        background: 'var(--product-line)',
                        border: '1px solid rgba(34,211,238,0.2)',
                        borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedRegionData.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--product-text)' }}>{selectedRegionData.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--product-muted)' }}>{selectedRegionData.acronym} · {selectedRegionData.category}</div>
                          </div>
                        </div>
                      </div>

                      {communityLoading ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--product-muted)', fontSize: 12 }}>Loading…</div>
                      ) : communityRegion.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🌐</div>
                          <div style={{ fontSize: 12, color: 'var(--product-muted)' }}>No community sources for this region yet.</div>
                        </div>
                      ) : (
                        communityRegion.map((c) => <ContribCard key={c.id} contrib={c} onRemove={removeContribution} />)
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--product-muted)', fontSize: 12 }}>
                      Click a brain region to see community research sources.
                    </div>
                  )}
                </>
              )}

              {/* SEARCH TAB — community */}
              {tab === 'search' && (
                <>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search community sources…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 12px', marginBottom: 12,
                      background: 'var(--product-line)', border: '1px solid rgba(34,211,238,0.25)',
                      borderRadius: 8, color: 'var(--product-text)', fontSize: 12, outline: 'none',
                    }}
                  />
                  {searchQuery.trim() ? (
                    communitySearch.length > 0 ? (
                      communitySearch.map((c) => <ContribCard key={c.id} contrib={c} onRemove={removeContribution} />)
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--product-muted)', fontSize: 12, padding: '24px 0' }}>
                        No community sources match "{searchQuery}"
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--product-muted)', fontSize: 12, padding: '24px 0' }}>
                      Type to search community sources.
                    </div>
                  )}
                </>
              )}

              {/* ALL TAB — community */}
              {tab === 'all' && (
                communityLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--product-muted)', fontSize: 12 }}>Loading…</div>
                ) : communityAll.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--product-muted)', fontSize: 12 }}>
                    No community contributions yet. Be the first to share evidence from the Community page.
                  </div>
                ) : (
                  communityAll.map((c) => <ContribCard key={c.id} contrib={c} onRemove={removeContribution} />)
                )
              )}
              </>}
            </>
          )}

          {/* ── PERSONAL MODE ── */}
          {!isCommunity && tab !== 'projects' && (
            <>
              {/* REGION TAB */}
              {tab === 'region' && (
                <>
                  {selectedRegionData ? (
                    <>
                      {/* Region info card */}
                      <div style={{
                        background: 'var(--product-line)',
                        border: '1px solid rgba(165,226,207,0.2)',
                        borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedRegionData.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--product-text)' }}>{selectedRegionData.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--product-muted)' }}>{selectedRegionData.acronym} · {selectedRegionData.category}</div>
                          </div>
                        </div>
                        {selectedRegionData.parentName && (
                          <div style={{ fontSize: 12, color: 'var(--product-muted)', marginTop: 6 }}>
                            Parent: <span style={{ color: 'var(--product-muted)' }}>{selectedRegionData.parentName}</span>
                          </div>
                        )}
                      </div>

                      {regionSources.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                          <div style={{ fontSize: 12, color: 'var(--product-muted)' }}>No sources linked to this region yet.</div>
                          <button
                            onClick={() => setAddModalOpen(true)}
                            style={{
                              marginTop: 12, padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              background: 'rgba(165,226,207,0.15)', border: '1px solid rgba(165,226,207,0.3)',
                              color: 'var(--product-accent)', cursor: 'pointer',
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
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--product-muted)', fontSize: 12 }}>
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
                      background: 'var(--product-line)', border: '1px solid rgba(165,226,207,0.25)',
                      borderRadius: 8, color: 'var(--product-text)', fontSize: 12, outline: 'none',
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
                      <div style={{ textAlign: 'center', color: 'var(--product-muted)', fontSize: 12, padding: '24px 0' }}>
                        No sources match "{searchQuery}"
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--product-muted)', fontSize: 12, padding: '24px 0' }}>
                      Type to search your sources.
                    </div>
                  )}
                </>
              )}

              {/* ALL SOURCES TAB */}
              {tab === 'all' && (
                allSources.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--product-muted)', fontSize: 12 }}>
                    No sources yet. Click <strong style={{ color: 'var(--product-accent)' }}>+ Add</strong> to import from PubMed or add manually.
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
            </>
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
