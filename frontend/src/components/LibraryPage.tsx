import React, { useState, useMemo } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { Source } from '../types/source';
import AddSourceModal from './AddSourceModal';
import { newId } from '../lib/id';
import './LibraryPage.css';
import ProjectsModal from './ProjectsModal';

type SortKey = 'date' | 'year' | 'title';

const LibraryPage: React.FC = () => {
  const {
    sources, structureLinks,
    setViewingSourceId, removeSource,
    updateSource, addStructureLink, brainRegions, addProject,
    projects, activeProjectId, setActiveProjectId,
  } = useBrainStore();

  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState<SortKey>('date');
  const [filterTag, setFilterTag] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [notice, setNotice] = useState('');
  const [projectName, setProjectName] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const linkedRegions = useMemo(() => Array.from(new Map(
    structureLinks.map((link) => [link.regionMeshName, link.regionName])
  )).sort((a, b) => a[1].localeCompare(b[1])), [structureLinks]);

  const organize = (action: (source: Source) => void) => {
    const papers = filtered.filter((s) => selected.includes(s.id));
    papers.forEach(action);
    setNotice(`Updated ${papers.length} paper${papers.length === 1 ? '' : 's'}.`);
    setSelected([]);
  };

  const changeFilter = (change: () => void) => { change(); setSelected([]); setNotice(''); };

  // All unique tags across all sources
  const allTags = useMemo(() => {
    const s = new Set<string>();
    sources.forEach((src) => src.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [sources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources
      .filter((s) => {
        if (activeProjectId && s.projectId !== activeProjectId) return false;
        if (filterTag && !s.tags.includes(filterTag)) return false;
        const links = structureLinks.filter((l) => l.sourceId === s.id);
        if (filterRegion === 'unlinked' && links.length) return false;
        if (filterRegion && filterRegion !== 'unlinked' && !links.some((l) => l.regionMeshName === filterRegion)) return false;
        if (!q) return true;
        return (
          s.title.toLowerCase().includes(q) ||
          s.authors.join(' ').toLowerCase().includes(q) ||
          (s.abstract ?? '').toLowerCase().includes(q) ||
          (s.journal ?? '').toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date')  return b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'year')  return (b.year ?? 0) - (a.year ?? 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [sources, search, sortBy, filterTag, filterRegion, activeProjectId, structureLinks]);

  const getLinkedCount = (id: string) =>
    structureLinks.filter((l) => l.sourceId === id).length;

  return (
    <div className="product-library" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'transparent', overflow: 'hidden',
    }}>
<div className="product-page-heading"><p>Your workspace</p><h1>Research Library</h1><span>Find papers, collect ideas, and organize your research. Brain links are optional.</span></div>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 24px',
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        background: 'var(--product-surface)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* Project filter chips */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', width: '100%', marginBottom: 4 }}>
            <button
              onClick={() => changeFilter(() => setActiveProjectId(null))}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${!activeProjectId ? 'rgba(165,226,207,0.6)' : 'rgba(100,116,139,0.2)'}`,
                background: !activeProjectId ? 'rgba(165,226,207,0.15)' : 'transparent',
                color: !activeProjectId ? 'var(--product-accent)' : 'var(--product-muted)',
              }}
            >All</button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => changeFilter(() => { setActiveProjectId(p.id); setSearch(''); setFilterTag(''); setFilterRegion(''); })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${activeProjectId === p.id ? p.color + '80' : 'rgba(100,116,139,0.2)'}`,
                  background: activeProjectId === p.id ? p.color + '22' : 'transparent',
                  color: activeProjectId === p.id ? p.color : 'var(--product-muted)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                {p.name}
              </button>
            ))}
            <button onClick={() => setShowProjectForm(!showProjectForm)}>+ New project</button>
            <button onClick={() => setShowProjectSettings(true)}>Manage projects</button>
            {showProjectForm && <form onSubmit={(e) => {
              e.preventDefault();
              const name = projectName.trim();
              if (!name) return;
              const id = newId();
              addProject({ id, name, mode: 'private', color: '#a5e2cf', createdAt: new Date().toISOString() });
              changeFilter(() => setActiveProjectId(id));
              setProjectName(''); setShowProjectForm(false);
            }} style={{ display: 'flex', gap: 6 }}>
              <input aria-label="New project name" autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" required />
              <button type="submit">Create</button>
            </form>}
          </div>

        {activeProject && <section aria-label="Selected project" style={{ width: '100%', padding: '8px 0', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <strong>{activeProject.name}</strong>
          <span>{activeProject.mode === 'community' ? 'Community' : 'Personal'} · {sources.filter((s) => s.projectId === activeProject.id).length} papers</span>
          <button onClick={() => setShowProjectSettings(true)}>Project settings</button>
          {activeProject.description && <p style={{ width: '100%', margin: 0 }}>{activeProject.description}</p>}
        </section>}

        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--product-accent)', color: 'var(--product-bg)', border: 0, fontWeight: 700, cursor: 'pointer' }}>Find & add papers</button>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--product-muted)', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => changeFilter(() => setSearch(e.target.value))}
            aria-label="Search saved papers"
            placeholder="Search saved papers…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '7px 12px 7px 30px',
              background: 'var(--product-surface)',
              border: '1px solid rgba(165,226,207,0.25)',
              borderRadius: 7, color: 'var(--product-text)', fontSize: 12, outline: 'none',
            }}
          />
        </div>

        {/* Tag filter */}
        <select
          value={filterTag}
          aria-label="Filter by topic"
          onChange={(e) => changeFilter(() => setFilterTag(e.target.value))}
          style={{
            padding: '7px 10px', borderRadius: 6, fontSize: 12,
            background: 'var(--product-surface)', border: '1px solid rgba(165,226,207,0.2)',
            color: filterTag ? 'var(--product-accent)' : 'var(--product-muted)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All topics / tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select aria-label="Filter by brain region" value={filterRegion} onChange={(e) => changeFilter(() => setFilterRegion(e.target.value))}>
          <option value="">All brain regions</option>
          <option value="unlinked">No brain links</option>
          {linkedRegions.map(([mesh, name]) => <option key={mesh} value={mesh}>{name}</option>)}
        </select>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['date', 'year', 'title'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: '5px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${sortBy === key ? 'rgba(165,226,207,0.6)' : 'rgba(100,116,139,0.2)'}`,
                background: sortBy === key ? 'rgba(165,226,207,0.15)' : 'transparent',
                color: sortBy === key ? 'var(--product-accent)' : 'var(--product-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}
            >{key}</button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ fontSize: 12, color: 'var(--product-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} / {sources.length} sources
        </div>
      </div>

      {filtered.length > 0 && <div style={{ padding: '10px 24px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <label><input type="checkbox" checked={filtered.every((s) => selected.includes(s.id))} onChange={(e) => setSelected(e.target.checked ? filtered.map((s) => s.id) : [])} /> Select all shown</label>
        {selected.length > 0 && <>
          <span>{selected.length} selected</span>
          <input aria-label="Topic name" list="library-topics" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic or subtopic" />
          <datalist id="library-topics">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
          <button disabled={!topic.trim()} onClick={() => { organize((s) => updateSource(s.id, { tags: Array.from(new Set([...s.tags, ...topic.split(',').map((t) => t.trim()).filter(Boolean)])) })); setTopic(''); }}>Add topic</button>
          {filterTag && <button onClick={() => organize((s) => updateSource(s.id, { tags: s.tags.filter((t) => t !== filterTag) }))}>Remove from {filterTag}</button>}
          <select aria-label="Move selected papers to project" value="" onChange={(e) => { if (e.target.value) organize((s) => updateSource(s.id, { projectId: e.target.value === 'unfiled' ? null : e.target.value })); }}>
            <option value="">Move to project…</option><option value="unfiled">Unfiled</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select aria-label="Link selected papers to brain region" value="" onChange={(e) => {
            const region = brainRegions.find((r) => r.meshName === e.target.value);
            if (region) organize((s) => {
              if (!structureLinks.some((l) => l.sourceId === s.id && l.regionMeshName === region.meshName))
                addStructureLink({ id: newId(), sourceId: s.id, regionMeshName: region.meshName, regionName: region.name, verified: false, createdAt: new Date().toISOString() });
            });
          }}><option value="">Link to region…</option>{brainRegions.map((r) => <option key={r.meshName} value={r.meshName}>{r.name}</option>)}</select>
          <button onClick={() => setSelected([])}>Clear selection</button>
        </>}
      </div>}
      <div role="status" style={{ padding: notice ? '0 24px 8px' : 0, color: 'var(--product-accent)' }}>{notice}</div>

      {/* ── Source list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {sources.length === 0 && !activeProject ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div className="product-empty-mark" aria-hidden="true">↗</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--product-muted)', marginBottom: 8 }}>No sources yet</div>
            <div style={{ fontSize: 13, color: 'var(--product-muted)', marginBottom: 24 }}>
              Search PubMed and Crossref, import a DOI, or add a paper manually. Organize it here before linking anatomy.
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: 'rgba(165,226,207,0.2)', border: '1px solid rgba(165,226,207,0.5)',
                color: 'var(--product-accent)', cursor: 'pointer',
              }}
            >
              Find your first paper
            </button>
          </div>
        ) : activeProject && !sources.some((s) => s.projectId === activeProject.id) ? (
          <div style={{ padding: '40px 0', color: 'var(--product-muted)' }}><p>No papers in {activeProject.name} yet.</p><button onClick={() => setShowAdd(true)}>Add first paper to project</button></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--product-muted)', fontSize: 13 }}>
            No sources match your search.
            <button onClick={() => { setSearch(''); setFilterTag(''); setFilterRegion(''); setActiveProjectId(null); }}>Clear filters</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                linkedCount={getLinkedCount(source.id)}
                selected={selected.includes(source.id)}
                onSelect={() => setSelected((ids) => ids.includes(source.id) ? ids.filter((id) => id !== source.id) : [...ids, source.id])}
                onOpen={() => setViewingSourceId(source.id)}
                onDelete={() => {
                  if (window.confirm('Remove this source?')) removeSource(source.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
      {showAdd && <AddSourceModal initialMode="search" initialTags={filterTag ? [filterTag] : []} prelinkedRegion={filterRegion && filterRegion !== 'unlinked' ? filterRegion : undefined} onClose={() => { setShowAdd(false); setSearch(''); }} />}
      {showProjectSettings && <ProjectsModal initialProjectId={activeProjectId ?? undefined} onClose={() => setShowProjectSettings(false)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SourceRow
// ---------------------------------------------------------------------------

interface RowProps {
  source:      Source;
  linkedCount: number;
  onOpen:      () => void;
  onDelete:    () => void;
  selected: boolean;
  onSelect: () => void;
}

const SourceRow: React.FC<RowProps> = ({ source, linkedCount, onOpen, onDelete, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 16,
        padding: '14px 18px', borderRadius: 8, cursor: 'pointer',
        background: hovered ? 'var(--product-line)' : 'var(--product-surface)',
        border: `1px solid ${hovered ? 'rgba(165,226,207,0.25)' : 'var(--product-line)'}`,
        transition: 'all 0.12s',
      }}
    >
      <input type="checkbox" aria-label={`Select ${source.title}`} checked={selected} onClick={(e) => e.stopPropagation()} onChange={onSelect} />
      {/* Left: type icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: source.doi ? 'rgba(165,226,207,0.12)' : 'rgba(100,116,139,0.1)',
        border: `1px solid ${source.doi ? 'rgba(165,226,207,0.2)' : 'rgba(100,116,139,0.15)'}`,
        fontSize: 16,
      }}>
        {source.doi ? '📄' : '📝'}
      </div>

      {/* Middle: metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={onOpen} style={{
          background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', maxWidth: '100%',
          fontSize: 13, fontWeight: 600, color: 'var(--product-text)',
          marginBottom: 3, lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {source.title}
        </button>
        <div style={{ fontSize: 12, color: 'var(--product-muted)', marginBottom: 6 }}>
          {source.authors.slice(0, 4).join(', ')}{source.authors.length > 4 ? ' et al.' : ''}
          {source.journal && <span> · <em>{source.journal}</em></span>}
          {source.year && <span> · {source.year}</span>}
        </div>

        {/* Tags + region badge */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {source.tags.slice(0, 4).map((t) => (
            <span key={t} style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 12,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc',
            }}>{t}</span>
          ))}
          {linkedCount > 0 && (
            <span style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 12,
              background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
              color: '#22d3ee',
            }}>
              {linkedCount} region{linkedCount !== 1 ? 's' : ''}
            </span>
          )}
          {source.abstract && (
            <span style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 12,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#34d399',
            }}>abstract</span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}
      >
        {source.doi && (
          <a
            href={`https://doi.org/${source.doi}`}
            target="_blank" rel="noopener noreferrer"
            title="Open paper"
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: 'rgba(165,226,207,0.1)', border: '1px solid rgba(165,226,207,0.25)',
              color: 'var(--product-accent)', textDecoration: 'none',
            }}
          >DOI ↗</a>
        )}
        <button
          aria-label={`Remove ${source.title}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            padding: '3px 7px', borderRadius: 4, fontSize: 12,
            background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', cursor: 'pointer',
          }}
        >×</button>
      </div>
    </div>
  );
};

export default LibraryPage;
