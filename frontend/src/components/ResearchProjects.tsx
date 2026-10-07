import React, { useEffect, useState } from 'react';
import { useBrainStore } from '../store/brainStore';
import { communityProjectPapers, fetchCommunityProjects, isSupabaseConfigured, type CommunityProject } from '../lib/supabase';

/** Local work stays accessible independently of the public project service. */
const ResearchProjects: React.FC = () => {
  const { projects, sources, structureLinks, explorerMode, activeProjectId, selectedRegion, regionMap,
    setActiveProjectId, setSelectedRegion, setViewingSourceId, setAppPage, user } = useBrainStore();
  const [shared, setShared] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(activeProjectId);
  const community = explorerMode === 'community';

  useEffect(() => { setOpenId(activeProjectId); setQuery(''); }, [activeProjectId, explorerMode]);
  useEffect(() => {
    let cancelled = false;
    setShared([]); setError(''); setLoading(false);
    if (!community || !isSupabaseConfigured()) return;
    setLoading(true);
    fetchCommunityProjects().then((data) => { if (!cancelled) setShared(data); })
      .catch((cause) => {
        if (!cancelled) setError(cause?.code === 'PGRST205' || cause?.code === '42P01'
          ? 'Shared projects are not available yet. Your community projects remain accessible below.'
          : 'Could not load shared projects. Your community projects remain accessible below.');
      }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [community, retry]);

  const ownIds = new Set(projects.map((p) => p.id));
  const local: CommunityProject[] = projects.filter((p) => p.mode === (community ? 'community' : 'private')).map((p) => ({
    id: p.id, user_id: user?.id ?? 'local', name: p.name, description: p.description, color: p.color,
    papers: communityProjectPapers(p.id, sources, structureLinks), updated_at: p.createdAt,
  }));
  const text = query.trim().toLowerCase();
  const visible = [...local, ...(community ? shared.filter((p) => !ownIds.has(p.id)) : [])].filter((p) =>
    (!activeProjectId || p.id === activeProjectId) &&
    (!selectedRegion || p.id === activeProjectId || p.papers.some((s) => s.regions.some((r) => r.meshName === selectedRegion))) &&
    (!text || `${p.name} ${p.description ?? ''} ${p.papers.map((s) => `${s.title} ${s.tags.join(' ')}`).join(' ')}`.toLowerCase().includes(text))
  );

  return <div>
    {community && <div role="status" className="research-feedback">
      <p>{!isSupabaseConfigured() ? 'Shared projects are unavailable. Your community projects remain accessible below.'
        : loading ? 'Loading shared projects…' : error || 'Explore your community projects and projects shared by other researchers.'}</p>
      {error && <button onClick={() => setRetry((n) => n + 1)}>Try again</button>}
    </div>}
    <input aria-label={community ? 'Search community projects' : 'Search personal projects'} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects or topics…" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', marginBottom: 12, background: 'var(--product-surface)', border: '1px solid var(--product-line)', borderRadius: 6, color: 'var(--product-text)' }} />
    {activeProjectId && <button onClick={() => setActiveProjectId(null)}>Show all projects</button>}
    {selectedRegion && !activeProjectId && <p style={{ fontSize: 12, color: 'var(--product-muted)' }}>Projects linked to {regionMap[selectedRegion]?.name ?? selectedRegion} <button onClick={() => setSelectedRegion(null)}>Show all regions</button></p>}
    {visible.length === 0 && !loading && !error && <p>{text ? 'No projects match your search.' : 'No projects in this workspace yet.'}</p>}
    {visible.length === 0 && <button onClick={() => setAppPage('library')}>Open Library to manage projects</button>}
    {visible.map((p) => <section key={p.id} style={{ border: '1px solid var(--product-line)', borderRadius: 6, padding: 12, marginBottom: 10 }}>
      <button aria-expanded={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)} style={{ background: 'transparent', border: 0, color: 'var(--product-text)', textAlign: 'left', cursor: 'pointer', width: '100%', padding: 0 }}>
        <strong>{p.name}</strong><span style={{ display: 'block', fontSize: 12, color: 'var(--product-muted)', marginTop: 4 }}>{ownIds.has(p.id) ? 'Your project' : 'Shared project'} · {p.papers.length} papers</span>
      </button>
      {p.description && <p style={{ fontSize: 12, color: 'var(--product-muted)' }}>{p.description}</p>}
      {openId === p.id && <div>
        {ownIds.has(p.id) && <button onClick={() => { setActiveProjectId(p.id); setAppPage('library'); }}>Open in Library</button>}
        {p.papers.length === 0 && <p>No papers yet. Add your first paper in Library.</p>}
        {p.papers.map((s) => <div key={s.id} style={{ borderTop: '1px solid var(--product-line)', padding: '10px 0', fontSize: 12 }}>
          {ownIds.has(p.id) ? <button onClick={() => setViewingSourceId(s.id)}>{s.title}</button> : <strong>{s.title}</strong>}
          <div style={{ color: 'var(--product-muted)', marginTop: 4 }}>{s.authors.join(', ')}{s.year ? ` · ${s.year}` : ''}</div>
          <div style={{ color: 'var(--product-muted)', margin: '4px 0' }}>{s.tags.join(', ')}</div>
          {s.regions.map((r) => <button key={r.meshName} disabled={!regionMap[r.meshName]} onClick={() => setSelectedRegion(r.meshName)}>{r.name}</button>)}
          {s.doi && <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noopener noreferrer">Open paper</a>}
        </div>)}
      </div>}
    </section>)}
  </div>;
};

export default ResearchProjects;
