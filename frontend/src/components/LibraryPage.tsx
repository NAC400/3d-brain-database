import React, { useState, useMemo } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { Source } from '../types/source';

type SortKey = 'date' | 'year' | 'title';

const LibraryPage: React.FC = () => {
  const {
    sources, structureLinks,
    setViewingSourceId, removeSource,
    setAppPage,
  } = useBrainStore();

  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState<SortKey>('date');
  const [filterTag, setFilterTag] = useState('');

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
        if (filterTag && !s.tags.includes(filterTag)) return false;
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
  }, [sources, search, sortBy, filterTag]);

  const getLinkedCount = (id: string) =>
    structureLinks.filter((l) => l.sourceId === id).length;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0a1120', overflow: 'hidden',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 24px',
        borderBottom: '1px solid rgba(30,41,59,0.8)',
        background: 'rgba(15,23,42,0.98)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: 13 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sources…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '7px 12px 7px 30px',
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none',
            }}
          />
        </div>

        {/* Tag filter */}
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: 6, fontSize: 11,
            background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.2)',
            color: filterTag ? '#60a5fa' : '#64748b', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">All tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['date', 'year', 'title'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${sortBy === key ? 'rgba(59,130,246,0.6)' : 'rgba(100,116,139,0.2)'}`,
                background: sortBy === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: sortBy === key ? '#60a5fa' : '#475569',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}
            >{key}</button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ fontSize: 11, color: '#334155', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} / {sources.length} sources
        </div>
      </div>

      {/* ── Source list ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#334155', marginBottom: 8 }}>No sources yet</div>
            <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 24 }}>
              Go to the Brain Explorer and add sources via DOI, PubMed search, or manual entry.
            </div>
            <button
              onClick={() => setAppPage('explorer')}
              style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.5)',
                color: '#60a5fa', cursor: 'pointer',
              }}
            >
              Open Brain Explorer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155', fontSize: 13 }}>
            No sources match your search.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                linkedCount={getLinkedCount(source.id)}
                onOpen={() => setViewingSourceId(source.id)}
                onDelete={() => {
                  if (window.confirm('Remove this source?')) removeSource(source.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
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
}

const SourceRow: React.FC<RowProps> = ({ source, linkedCount, onOpen, onDelete }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 16,
        padding: '14px 18px', borderRadius: 8, cursor: 'pointer',
        background: hovered ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.6)',
        border: `1px solid ${hovered ? 'rgba(59,130,246,0.25)' : 'rgba(30,41,59,0.6)'}`,
        transition: 'all 0.12s',
      }}
    >
      {/* Left: type icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: source.doi ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.1)',
        border: `1px solid ${source.doi ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.15)'}`,
        fontSize: 16,
      }}>
        {source.doi ? '📄' : '📝'}
      </div>

      {/* Middle: metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#e2e8f0',
          marginBottom: 3, lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {source.title}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
          {source.authors.slice(0, 4).join(', ')}{source.authors.length > 4 ? ' et al.' : ''}
          {source.journal && <span> · <em>{source.journal}</em></span>}
          {source.year && <span> · {source.year}</span>}
        </div>

        {/* Tags + region badge */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {source.tags.slice(0, 4).map((t) => (
            <span key={t} style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 9,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc',
            }}>{t}</span>
          ))}
          {linkedCount > 0 && (
            <span style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 9,
              background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
              color: '#22d3ee',
            }}>
              {linkedCount} region{linkedCount !== 1 ? 's' : ''}
            </span>
          )}
          {source.abstract && (
            <span style={{
              padding: '1px 6px', borderRadius: 3, fontSize: 9,
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
              padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
              color: '#60a5fa', textDecoration: 'none',
            }}
          >DOI ↗</a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            padding: '3px 7px', borderRadius: 4, fontSize: 11,
            background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', cursor: 'pointer',
          }}
        >×</button>
      </div>
    </div>
  );
};

export default LibraryPage;
