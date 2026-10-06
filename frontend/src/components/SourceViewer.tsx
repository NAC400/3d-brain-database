import React, { useState, useEffect, useCallback } from 'react';
import { useBrainStore } from '../store/brainStore';
import { newId } from '../lib/id';
import type { StructureLink } from '../store/brainStore';
import type { Source, Note } from '../types/source';
import { fetchAbstract } from '../lib/pubmed';
import { downloadPdf, findOpenAccessPdf } from '../lib/fullText';
import { NoteList } from './NoteEditor';

// ---------------------------------------------------------------------------
// Citation format generators
// ---------------------------------------------------------------------------

/**
 * Detect PubMed "LastName Initials" format (e.g. "Cheron G", "van den Berg AM").
 * The last token is all uppercase letters (1–4 chars = initials block).
 */
const isPubMedFormat = (name: string): boolean => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 && /^[A-Z]{1,4}$/.test(parts[parts.length - 1]);
};

/** Extract the last name from any author format. */
const getLastName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  // PubMed "Cheron G" → last name is everything except final token
  return isPubMedFormat(name) ? parts.slice(0, -1).join(' ') : parts[parts.length - 1];
};

/**
 * APA 7th: "Last, F. M."
 * PubMed "Cheron G"   → "Cheron, G."
 * Natural "Gary Cheron" → "Cheron, G."
 */
const formatAuthorAPA = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  if (isPubMedFormat(name)) {
    const lastName = parts.slice(0, -1).join(' ');
    const initials = parts[parts.length - 1].split('').map((c) => `${c}.`).join(' ');
    return `${lastName}, ${initials}`;
  }
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => `${p[0]}.`).join(' ');
  return `${lastName}, ${initials}`;
};

/**
 * APA 7th author list with correct ampersand / ellipsis rules:
 * 1 author  → "Last, F."
 * 2–20      → "Last, F., ... & Last, F."
 * 21+       → first 19 authors + "... Last, F." (no ampersand per APA 7)
 */
const buildAPAAuthors = (authors: string[]): string => {
  if (authors.length === 0) return '';
  const fmt = authors.map(formatAuthorAPA);
  if (authors.length === 1) return fmt[0];
  if (authors.length <= 20) {
    return fmt.slice(0, -1).join(', ') + ', & ' + fmt[fmt.length - 1];
  }
  // 21+ authors
  return fmt.slice(0, 19).join(', ') + ', . . . ' + fmt[fmt.length - 1];
};

/**
 * MLA 9th first-author format: "Last, First" (or "Last, I." for PubMed)
 * Subsequent authors stay as-is (natural order).
 */
const formatAuthorMLAFirst = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  if (isPubMedFormat(name)) {
    const lastName = parts.slice(0, -1).join(' ');
    const initials = parts[parts.length - 1].split('').map((c) => `${c}.`).join(' ');
    return `${lastName}, ${initials}`;
  }
  const lastName = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return `${lastName}, ${first}`;
};

/**
 * Vancouver: "Last AB" (no periods after initials)
 * PubMed "Cheron G" → already correct
 * Natural "Gary Cheron" → "Cheron G"
 */
const formatAuthorVancouver = (name: string): string => {
  if (isPubMedFormat(name)) return name; // already "Last Initials"
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const lastName = parts[parts.length - 1];
  const inits = parts.slice(0, -1).map((p) => p[0]).join('');
  return `${lastName} ${inits}`;
};

/**
 * BibTeX: "Last, First Middle" or "Last, I." for PubMed
 */
const formatAuthorBibTeX = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  if (isPubMedFormat(name)) {
    const lastName = parts.slice(0, -1).join(' ');
    const initials = parts[parts.length - 1].split('').map((c) => `${c}.`).join(' ');
    return `${lastName}, ${initials}`;
  }
  const lastName = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return `${lastName}, ${first}`;
};

const buildCitations = (source: Source): Record<string, string> => {
  const { title, authors, journal, year, doi, volume, issue, pages } = source;
  const doiStr = doi ? `https://doi.org/${doi}` : '';
  const yr = year ?? 'n.d.';
  const jnl = journal ?? '';
  const issuePart = issue ? `(${issue})` : '';
  const journalDetails = jnl
    ? ` ${jnl}${volume ? `, ${volume}${issuePart}` : ''}${pages ? `, ${pages}` : ''}.`
    : '';

  // APA 7th — Purdue OWL spec
  const apaAuthors = buildAPAAuthors(authors);
  const apa = `${apaAuthors}${apaAuthors ? ' ' : ''}(${yr}). ${title}.${journalDetails}${doiStr ? ` ${doiStr}` : ''}`;

  // MLA 9th
  const mlaFirst = authors[0] ? formatAuthorMLAFirst(authors[0]) : '';
  const mlaOthers = authors.slice(1, 3).map((a) => {
    // Non-first MLA authors in natural order
    if (isPubMedFormat(a)) {
      const parts = a.trim().split(/\s+/);
      const ln = parts.slice(0, -1).join(' ');
      const ini = parts[parts.length - 1].split('').map((c) => `${c}.`).join(' ');
      return `${ini} ${ln}`;
    }
    return a;
  });
  const mlaEtAl = authors.length > 3 ? ', et al.' : '';
  const mlaAuthors = [mlaFirst, ...mlaOthers].filter(Boolean).join(', ') + mlaEtAl;
  const mla = `${mlaAuthors}${mlaAuthors ? '. ' : ''}"${title}."${jnl ? ` ${jnl},` : ''}${volume ? ` vol. ${volume},` : ''}${issue ? ` no. ${issue},` : ''} ${yr}${pages ? `, pp. ${pages}` : ''}.${doiStr ? ` ${doiStr}.` : ''}`;

  // Vancouver (up to 6 authors, then et al.)
  const vanList = authors.slice(0, 6).map(formatAuthorVancouver);
  const vanAuthors = vanList.join(', ') + (authors.length > 6 ? ', et al.' : '');
  const van = `${vanAuthors}${vanAuthors ? '. ' : ''}${title}.${jnl ? ` ${jnl}.` : ''} ${yr}${volume ? `;${volume}${issuePart}` : ''}${pages ? `:${pages}` : ''}.${doiStr ? ` doi:${doi}` : ''}`;

  // Chicago author-date (similar to APA but no initials period spacing requirement)
  const chicFirst = authors[0] ? formatAuthorMLAFirst(authors[0]) : '';
  const chicRest = authors.slice(1).map((a) => {
    if (isPubMedFormat(a)) {
      const parts = a.trim().split(/\s+/);
      const ln = parts.slice(0, -1).join(' ');
      const ini = parts[parts.length - 1].split('').map((c) => `${c}.`).join(' ');
      return `${ini} ${ln}`;
    }
    return a;
  });
  const chicAuthors = [chicFirst, ...chicRest].filter(Boolean).join(', ');
  const chic = `${chicAuthors}${chicAuthors ? '. ' : ''}"${title}."${jnl ? ` ${jnl}` : ''}${volume ? ` ${volume}` : ''}${issuePart ? issuePart : ''} (${yr})${pages ? `: ${pages}` : ''}.${doiStr ? ` ${doiStr}.` : ''}`;

  // BibTeX
  const firstLastName = authors[0] ? getLastName(authors[0]) : 'Author';
  const key = firstLastName.replace(/\s+/g, '') + yr;
  const bibtexAuthors = authors.map(formatAuthorBibTeX).join(' and ');
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

type ContentTab = 'abstract' | 'paper' | 'cite' | 'regions' | 'notes';

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
  const [abstractError, setAbstractError] = useState('');
  const [fullTextMessage, setFullTextMessage] = useState('');
  const [fullTextLoading, setFullTextLoading] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionDropOpen, setRegionDropOpen] = useState(false);

  const source = sources.find((s) => s.id === viewingSourceId);
  const sourceId = source?.id;
  const sourcePmid = source?.pmid;
  const sourceDoi = source?.doi;
  const sourceAbstract = source?.abstract;

  const loadAbstract = useCallback(async () => {
    if (!sourceId || (!sourcePmid && !sourceDoi)) return;
    setAbstractLoading(true); setAbstractError('');
    const result = await fetchAbstract(sourcePmid, sourceDoi);
    if (result.abstract) updateSource(sourceId, { abstract: result.abstract });
    else setAbstractError(result.error ?? 'Abstract could not be retrieved.');
    setAbstractLoading(false);
  }, [sourceId, sourcePmid, sourceDoi, updateSource]);

  // Auto-fetch abstract via Europe PMC when a PubMed import has no abstract.
  useEffect(() => {
    if (!sourceId || sourceAbstract || (!sourcePmid && !sourceDoi)) return;
    void loadAbstract();
  }, [sourceId, sourceAbstract, sourcePmid, sourceDoi, loadAbstract]);

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

  const noteCount = source.notes?.length ?? 0;

  const TAB_DEFS: { id: ContentTab; label: string }[] = [
    { id: 'abstract', label: 'Abstract' },
    { id: 'paper',    label: 'Full Paper' },
    { id: 'regions',  label: `Regions (${linkedRegions.length})` },
    { id: 'notes',    label: `Notes${noteCount > 0 ? ` (${noteCount})` : ''}` },
    { id: 'cite',     label: 'Cite' },
  ];

  const genId = newId;

  const addNote = () => {
    const now = new Date().toISOString();
    const note: Note = { id: genId(), content: '', createdAt: now, updatedAt: now, versions: [] };
    updateSource(source.id, { notes: [...(source.notes ?? []), note] });
  };

  const saveNote = (noteId: string, content: string) => {
    const now = new Date().toISOString();
    updateSource(source.id, {
      notes: (source.notes ?? []).map((n) => {
        if (n.id !== noteId) return n;
        return { ...n, content, updatedAt: now, versions: [...n.versions, { content: n.content, savedAt: now }] };
      }),
    });
  };

  const deleteNote = (noteId: string) => {
    updateSource(source.id, { notes: (source.notes ?? []).filter((n) => n.id !== noteId) });
  };

  const downloadOfficialPdf = async () => {
    setFullTextMessage(''); setFullTextLoading(true);
    try {
      const result = await findOpenAccessPdf(source.pmid, source.fullTextUrls, source.doi);
      if (!result.pdfUrl) {
        setFullTextMessage('An open-access PDF is not available from our sources. Try the publisher page, your institution’s library, or request a copy from the authors.');
        return;
      }
      const filename = source.title.slice(0, 80).replace(/[^a-z0-9]/gi, '_') + '.pdf';
      const outcome = await downloadPdf(result.pdfUrl, filename);
      setFullTextMessage(outcome === 'downloaded'
        ? `Downloaded the open-access PDF from ${result.source ?? 'an approved source'}.`
        : `Opened the verified PDF from ${result.source ?? 'an approved source'} in a new tab. Use your browser’s download control to save it.`);
    } catch {
      setFullTextMessage('We could not open a downloadable PDF from this source. Try the publisher page or your institution’s library.');
    } finally {
      setFullTextLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '7px 12px',
    background: 'var(--product-surface)',
    border: '1px solid rgba(165,226,207,0.25)',
    borderRadius: 6, color: 'var(--product-text)', fontSize: 12, outline: 'none',
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
        borderBottom: '1px solid rgba(165,226,207,0.2)',
        background: 'var(--product-surface)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setViewingSourceId(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', color: 'var(--product-accent)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}
        >
          ← Back
        </button>

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--product-accent)', textTransform: 'uppercase' }}>
          Source Detail
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {source.pmid && (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
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
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'rgba(165,226,207,0.12)', border: '1px solid rgba(165,226,207,0.35)',
                color: 'var(--product-accent)', textDecoration: 'none',
              }}
            >
              Open Paper ↗
            </a>
          )}
          <button
            onClick={downloadOfficialPdf}
            disabled={fullTextLoading || (!source.pmid && !source.doi && !(source.fullTextUrls?.length))}
            title="Download an open-access or publisher-provided PDF when available"
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
              color: '#34d399', cursor: fullTextLoading ? 'wait' : 'pointer',
            }}
          >
            {fullTextLoading ? 'Finding PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── Main layout: meta + tabs ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '28px 24px' }}>
        <div style={{ width: '100%', maxWidth: 800 }}>

          {/* Title */}
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--product-text)', lineHeight: 1.35, margin: '0 0 10px' }}>
            {source.title}
          </h1>

          {/* Authors / journal / year */}
          <div style={{ fontSize: 13, color: 'var(--product-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            {source.authors.slice(0, 6).join(', ')}{source.authors.length > 6 ? ' et al.' : ''}
            {source.journal && <span> · <em style={{ color: 'var(--product-muted)' }}>{source.journal}</em></span>}
            {source.year && <span> · {source.year}</span>}
          </div>

          {/* Tags */}
          {source.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
              {source.tags.map((t) => (
                <span key={t} style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 12,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc',
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* ID badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {source.doi && (
              <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, background: 'var(--product-surface)', border: '1px solid rgba(165,226,207,0.2)', color: 'var(--product-muted)' }}>
                DOI: <span style={{ color: '#93c5fd', userSelect: 'all' }}>{source.doi}</span>
              </div>
            )}
            {source.pmid && (
              <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, background: 'var(--product-surface)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--product-muted)' }}>
                PMID: <span style={{ color: '#6ee7b7', userSelect: 'all' }}>{source.pmid}</span>
              </div>
            )}
            <div style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, background: 'var(--product-surface)', border: '1px solid rgba(165,226,207,0.15)', color: 'var(--product-muted)' }}>
              Added: <span style={{ color: 'var(--product-muted)' }}>{new Date(source.createdAt).toLocaleDateString()}</span>
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
                  color: tab === t.id ? 'var(--product-accent)' : 'var(--product-muted)',
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
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--product-muted)', fontSize: 13 }}>
                  Fetching abstract from PubMed…
                </div>
              ) : source.abstract ? (
                <div style={{
                  background: 'var(--product-line)',
                  border: '1px solid rgba(165,226,207,0.15)',
                  borderRadius: 10, padding: '20px 24px',
                }}>
                  <p style={{ fontSize: 14, color: 'var(--product-text)', lineHeight: 1.8, margin: 0 }}>
                    {source.abstract}
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '32px', textAlign: 'center',
                  background: 'var(--product-line)',
                  border: '1px solid rgba(165,226,207,0.1)', borderRadius: 10,
                  color: 'var(--product-muted)', fontSize: 13,
                }}>
                  <div>{source.pmid || source.doi
                    ? abstractError || 'Abstract could not be retrieved from the available research databases.'
                    : 'No abstract stored. Add one by editing this source, or use DOI/research search import.'}</div>
                  {(source.pmid || source.doi) && (
                    <button onClick={loadAbstract} style={{ marginTop: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(165,226,207,0.35)', background: 'rgba(165,226,207,0.12)', color: 'var(--product-accent)', cursor: 'pointer', fontSize: 12 }}>
                      Retry abstract lookup
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Full paper tab ── */}
          {tab === 'paper' && (
            <div>
              <button
                onClick={downloadOfficialPdf}
                disabled={fullTextLoading || (!source.pmid && !source.doi && !(source.fullTextUrls?.length))}
                title={source.pmid || source.doi || source.fullTextUrls?.length ? 'Download an open-access or publisher-provided PDF when available' : 'A PubMed ID, DOI, or publisher PDF link is required'}
                style={{ padding: '10px 14px', borderRadius: 7, marginBottom: 12, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.12)', color: '#34d399', cursor: source.pmid || source.doi || source.fullTextUrls?.length ? 'pointer' : 'not-allowed', opacity: source.pmid || source.doi || source.fullTextUrls?.length ? 1 : 0.5, fontSize: 12, fontWeight: 700 }}
              >
                {fullTextLoading ? 'Looking for available PDF…' : 'Download Available PDF'}
              </button>
              {fullTextMessage && <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 7, background: 'var(--product-line)', border: '1px solid rgba(165,226,207,0.16)', color: 'var(--product-muted)', fontSize: 12 }}>{fullTextMessage}</div>}
              {source.doi ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--product-muted)', marginBottom: 16 }}>
                    Full-text availability depends on publisher access. Try the links below.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Publisher page (DOI)', href: `https://doi.org/${source.doi}`, color: 'var(--product-accent)', border: 'rgba(165,226,207,0.35)' },
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
                          background: 'var(--product-surface)',
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
                        background: 'var(--product-surface)',
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
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--product-line)', border: '1px solid rgba(165,226,207,0.1)', borderRadius: 10, color: 'var(--product-muted)', fontSize: 13 }}>
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
                        style={{ background: 'none', border: 'none', color: 'var(--product-muted)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--product-muted)', marginBottom: 16 }}>No brain regions linked yet.</p>
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
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, background: 'var(--product-bg)', border: '1px solid rgba(165,226,207,0.25)', borderRadius: 6, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {regionMatches.map((r) => (
                      <div
                        key={r.meshName}
                        onClick={() => { addLink(r.meshName); setRegionSearch(''); setRegionDropOpen(false); }}
                        style={{ padding: '7px 12px', fontSize: 12, color: 'var(--product-text)', cursor: 'pointer', borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(165,226,207,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {r.name} <span style={{ color: 'var(--product-muted)', fontSize: 12 }}>{r.acronym}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Notes tab ── */}
          {tab === 'notes' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--product-muted)', marginBottom: 16 }}>
                Markdown-supported notes attached to this source. Supports **bold**, *italic*, `code`, # headings, and - lists.
              </p>
              <NoteList
                notes={source.notes ?? []}
                onAdd={addNote}
                onSave={saveNote}
                onDelete={deleteNote}
              />
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
                      padding: '4px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${citeFormat === fmt ? 'rgba(165,226,207,0.6)' : 'rgba(100,116,139,0.2)'}`,
                      background: citeFormat === fmt ? 'rgba(165,226,207,0.18)' : 'transparent',
                      color: citeFormat === fmt ? 'var(--product-accent)' : 'var(--product-muted)',
                    }}
                  >{fmt}</button>
                ))}
              </div>

              {/* Citation text */}
              <div style={{
                background: 'var(--product-surface)',
                border: '1px solid rgba(165,226,207,0.2)',
                borderRadius: 8, padding: '16px 20px', marginBottom: 12,
                fontFamily: citeFormat === 'BibTeX' ? 'monospace' : 'inherit',
                fontSize: 13, color: 'var(--product-text)', lineHeight: 1.8,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {citations[citeFormat]}
              </div>

              <button
                onClick={copyCitation}
                style={{
                  padding: '7px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: copied ? 'rgba(16,185,129,0.18)' : 'rgba(165,226,207,0.18)',
                  border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(165,226,207,0.4)'}`,
                  color: copied ? '#34d399' : 'var(--product-accent)',
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
                padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
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
