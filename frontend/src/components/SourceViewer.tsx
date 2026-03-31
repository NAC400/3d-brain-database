import React, { useState, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { StructureLink } from '../store/brainStore';
import type { Source } from '../types/source';
import { fetchAbstract } from '../lib/pubmed';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------------------------------------------------------------------------
// Citation format generators
// ---------------------------------------------------------------------------

/** Best-effort "Last, F." from a full name string */
const formatAuthorAPA = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => p[0] + '.').join(' ');
  return `${last}, ${initials}`;
};

const formatAuthorMLA = (name: string, isFirst: boolean): string => {
  if (!isFirst) return name;
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return `${last}, ${first}`;
};

const buildCitations = (source: Source): Record<string, string> => {
  const { title, authors, journal, year, doi } = source;
  const doiStr = doi ? `https://doi.org/${doi}` : '';
  const yr = year ?? 'n.d.';
  const jnl = journal ?? '';

  // APA 7th
  const apaAuthors = authors.length
    ? authors.slice(0, 20).map(formatAuthorAPA).join(', ') + (authors.length > 20 ? ', ...' : '')
    : '';
  const apa = `${apaAuthors}${apaAuthors ? ' ' : ''}(${yr}). ${title}.${jnl ? ` *${jnl}*.` : ''}${doiStr ? ` ${doiStr}` : ''}`;

  // MLA 9th
  const mlaFirst = authors[0] ? formatAuthorMLA(authors[0], true) : '';
  const mlaRest = authors.slice(1, 3).join(', ');
  const mlaEtAl = authors.length > 3 ? ', et al.' : '';
  const mlaAuthors = [mlaFirst, mlaRest].filter(Boolean).join(', ') + mlaEtAl;
  const mla = `${mlaAuthors}${mlaAuthors ? '. ' : ''}"${title}."${jnl ? ` *${jnl}*,` : ''} ${yr}.${doiStr ? ` ${doiStr}.` : ''}`;

  // Vancouver
  const vanAuthors = authors.slice(0, 6).map((a) => {
    const parts = a.trim().split(' ');
    if (parts.length < 2) return a;
    const last = parts[parts.length - 1];
    const inits = parts.slice(0, -1).map((p) => p[0]).join('');
    return `${last} ${inits}`;
  }).join(', ') + (authors.length > 6 ? ', et al.' : '');
  const van = `${vanAuthors}${vanAuthors ? '. ' : ''}${title}.${jnl ? ` ${jnl}.` : ''} ${yr}.${doiStr ? ` doi:${doi}` : ''}`;

  // Chicago
  const chicFirst = authors[0] ? formatAuthorMLA(authors[0], true) : '';
  const chicRest = authors.slice(1).join(', ');
  const chicAuthors = [chicFirst, chicRest].filter(Boolean).join(', ');
  const chic = `${chicAuthors}${chicAuthors ? '. ' : ''}"${title}."${jnl ? ` *${jnl}*` : ''} (${yr}).${doiStr ? ` ${doiStr}.` : ''}`;

  // BibTeX
  const key = (authors[0]?.split(' ').pop() ?? 'Author') + yr;
  const bibtexAuthors = authors.map((a) => {
    const parts = a.trim().split(' ');
    if (parts.length < 2) return a;
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(' ');
    return `${last}, ${first}`;
  }).join(' and ');
  const bibtex =
`@article{${key},
  author  = {${bibtexAuthors}},
  title   = {${title}},${jnl ? `\n  journal = {${jnl}},` : ''}
  year    = {${yr}},${doiStr ? `\n  doi     = {${doi}},` : ''}
}`;

  return { APA: apa, MLA: mla, Vancouver: van, Chicago: chic, BibTeX: bibtex };
};

// ---------------------------------------------------------------------------
// SourceViewer component
// ---------------------------------------------------------------------------

type ContentTab = 'abstract' | 'paper' | 'cite' | 'regions';

const SourceViewer: React.FC = () => {
  const {
    viewingSourceId, setViewingSourceId,
    sources, structureLinks,
    regionMap, brainRegions,
    addStructureLink, removeStructureLink,
    setSelectedRegion, setCameraTarget, regionCentroids,
    removeSource, updateSource,
  } = useBrainStore();

  const [tab, setTab]                   = useState<ContentTab>('abstract');
  const [citeFormat, setCiteFormat]     = useState<string>('APA');
  const [copied, setCopied]             = useState(false);
  const [abstractLoading, setAbstractLoading] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionDropOpen, setRegionDropOpen] = useState(false);

  const source = sources.find((s) => s.id === viewingSourceId);

  // Auto-fetch abstract via EFetch if source has a pmid but no abstract
  useEffect(() => {
    if (!source) return;
    if (source.abstract) return;
    if (!source.pmid) return;
    let cancelled = false;
    setAbstractLoading(true);
    fetchAbstract(source.pmid).then((text) => {
      if (cancelled || !text) return;
      updateSource(source.id, { abstract: text });
    }).finally(() => {
      if (!cancelled) setAbstractLoading(false);
    });
    return () => { cancelled = true; };
  }, [source?.id, source?.pmid, source?.abstract]);

  if (!source) return null;

  const linkedRegions = structureLinks.filter((l) => l.sourceId === source.id);
  const citations = buildCitations(source);

  const regionMatches = regionSearch.trim()
    ? brainRegions
        .filter((r) =>
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
    setRegionDropOpen(false);
  };

  const jumpToRegion = (meshName: string) => {
    setViewingSourceId(null);
    setSelectedRegion(meshName);
    const c = regionCentroids[meshName];
    if (c) setCameraTarget({ position: [c[0], c[1], c[2] + 0.6], lookAt: [c[0], c[1], c[2]] });
  };

  const handleDelete = () => {
    if (window.confirm('Permanently remove this source?')) {
      removeSource(source.id);
      setViewingSourceId(null);
    }
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(citations[citeFormat] ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const TAB_DEFS: { id: ContentTab; label: string }[] = [
    { id: 'abstract', label: 'Abstract' },
    { id: 'paper',    label: 'Full Paper' },
    { id: 'regions',  label: `Regions (${linkedRegions.length})` },
    { id: 'cite',     label: 'Cite' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '7px 12px',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(7,11,22,0.97)',
      display: 'flex', flexDirection: 'column',
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
          ← Back
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3b82f6', textTransform: 'uppercase' }}>
          Source Detail
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {source.pmid && (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
                color: '#34d399', textDecoration: 'none',
              }}
            >
              PubMed ↗
            </a>
          )}
          {source.doi && (
            <a
              href={`https://doi.org/${source.doi}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)',
                color: '#60a5fa', textDecoration: 'none',
              }}
            >
              Open Paper ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Main layout: meta + tabs ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '28px 24px' }}>
        <div style={{ width: '100%', maxWidth: 800 }}>

          {/* Title */}
          <h1 style={{ fontSize: 21, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.35, margin: '0 0 10px' }}>
            {source.title}
          </h1>

          {/* Authors / journal / year */}
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
            {source.authors.slice(0, 6).join(', ')}{source.authors.length > 6 ? ' et al.' : ''}
            {source.journal && <span> · <em style={{ color: '#94a3b8' }}>{source.journal}</em></span>}
            {source.year && <span> · {source.year}</span>}
          </div>

          {/* Tags */}
          {source.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
              {source.tags.map((t) => (
                <span key={t} style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 11,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc',
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* ID badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {source.doi && (
              <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(59,130,246,0.2)', color: '#64748b' }}>
                DOI: <span style={{ color: '#93c5fd', userSelect: 'all' }}>{source.doi}</span>
              </div>
            )}
            {source.pmid && (
              <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.2)', color: '#64748b' }}>
                PMID: <span style={{ color: '#6ee7b7', userSelect: 'all' }}>{source.pmid}</span>
              </div>
            )}
            <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 11, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(59,130,246,0.15)', color: '#64748b' }}>
              Added: <span style={{ color: '#94a3b8' }}>{new Date(source.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* ── Content tabs ── */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', marginBottom: 20, gap: 0 }}>
            {TAB_DEFS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 18px', fontSize: 12, fontWeight: 600,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: tab === t.id ? '#60a5fa' : '#475569',
                  borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                  letterSpacing: 0.3,
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* ── Abstract tab ── */}
          {tab === 'abstract' && (
            <div>
              {abstractLoading ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                  Fetching abstract from PubMed…
                </div>
              ) : source.abstract ? (
                <div style={{
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 10, padding: '20px 24px',
                }}>
                  <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, margin: 0 }}>
                    {source.abstract}
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '32px', textAlign: 'center',
                  background: 'rgba(30,41,59,0.3)',
                  border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10,
                  color: '#334155', fontSize: 13,
                }}>
                  {source.pmid
                    ? 'Abstract could not be retrieved from PubMed.'
                    : 'No abstract stored. Add one by editing this source, or use DOI/PubMed import.'}
                </div>
              )}
            </div>
          )}

          {/* ── Full paper tab ── */}
          {tab === 'paper' && (
            <div>
              {source.doi ? (
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                    Full-text availability depends on publisher access. Try the links below.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Publisher page (DOI)', href: `https://doi.org/${source.doi}`, color: '#60a5fa', border: 'rgba(59,130,246,0.35)' },
                      { label: 'Unpaywall (Open Access)', href: `https://unpaywall.org/${source.doi}`, color: '#34d399', border: 'rgba(16,185,129,0.35)' },
                      { label: 'Europe PMC', href: `https://europepmc.org/search?query=doi:${source.doi}`, color: '#a78bfa', border: 'rgba(139,92,246,0.35)' },
                    ].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 18px', borderRadius: 8,
                          background: 'rgba(15,23,42,0.7)',
                          border: `1px solid ${link.border}`,
                          color: link.color, textDecoration: 'none',
                          fontSize: 13, fontWeight: 600,
                        }}
                      >
                        {link.label}
                        <span style={{ fontSize: 16 }}>↗</span>
                      </a>
                    ))}
                  </div>
                  {source.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 18px', borderRadius: 8, marginTop: 10,
                        background: 'rgba(15,23,42,0.7)',
                        border: '1px solid rgba(16,185,129,0.35)',
                        color: '#34d399', textDecoration: 'none',
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      PubMed full record ↗
                      <span style={{ fontSize: 16 }}>↗</span>
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, color: '#334155', fontSize: 13 }}>
                  No DOI stored — cannot look up full text.
                </div>
              )}
            </div>
          )}

          {/* ── Regions tab ── */}
          {tab === 'regions' && (
            <div>
              {linkedRegions.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {linkedRegions.map((link) => (
                    <div key={link.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 6,
                      background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)',
                    }}>
                      <button
                        onClick={() => jumpToRegion(link.regionMeshName)}
                        style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {link.regionName}
                      </button>
                      <button
                        onClick={() => removeStructureLink(link.id)}
                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#334155', marginBottom: 16 }}>No brain regions linked yet.</p>
              )}

              {/* Add region */}
              <div style={{ position: 'relative', maxWidth: 340 }}>
                <input
                  value={regionSearch}
                  onChange={(e) => { setRegionSearch(e.target.value); setRegionDropOpen(true); }}
                  onFocus={() => setRegionDropOpen(true)}
                  placeholder="Search and link a brain region…"
                  style={inputStyle}
                />
                {regionDropOpen && regionMatches.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, background: '#0f172a', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {regionMatches.map((r) => (
                      <div
                        key={r.meshName}
                        onClick={() => { addLink(r.meshName); setRegionSearch(''); setRegionDropOpen(false); }}
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
          )}

          {/* ── Cite tab ── */}
          {tab === 'cite' && (
            <div>
              {/* Format selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {Object.keys(citations).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setCiteFormat(fmt)}
                    style={{
                      padding: '4px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${citeFormat === fmt ? 'rgba(59,130,246,0.6)' : 'rgba(100,116,139,0.2)'}`,
                      background: citeFormat === fmt ? 'rgba(59,130,246,0.18)' : 'transparent',
                      color: citeFormat === fmt ? '#60a5fa' : '#475569',
                    }}
                  >{fmt}</button>
                ))}
              </div>

              {/* Citation text */}
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 8, padding: '16px 20px', marginBottom: 12,
                fontFamily: citeFormat === 'BibTeX' ? 'monospace' : 'inherit',
                fontSize: 13, color: '#cbd5e1', lineHeight: 1.8,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {citations[citeFormat]}
              </div>

              <button
                onClick={copyCitation}
                style={{
                  padding: '7px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: copied ? 'rgba(16,185,129,0.18)' : 'rgba(59,130,246,0.18)',
                  border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(59,130,246,0.4)'}`,
                  color: copied ? '#34d399' : '#60a5fa',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copied' : 'Copy to clipboard'}
              </button>
            </div>
          )}

          {/* ── Danger zone ── */}
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.1)', paddingTop: 20, marginTop: 32 }}>
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
