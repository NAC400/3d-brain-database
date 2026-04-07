import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { Source, StructureLink } from '../store/brainStore';
import type { PubMedResult } from '../types/source';
import { searchPubMed } from '../lib/pubmed';
import { lookupDOI } from '../lib/crossref';

type Mode = 'doi' | 'pubmed' | 'manual';

interface Props {
  onClose: () => void;
  prelinkedRegion?: string;   // mesh name to pre-link on save
}

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const AddSourceModal: React.FC<Props> = ({ onClose, prelinkedRegion }) => {
  const { addSource, addStructureLink, regionMap, brainRegions } = useBrainStore();

  const [mode, setMode]         = useState<Mode>('doi');
  const [doi, setDoi]           = useState('');
  const [pmQuery, setPmQuery]   = useState('');
  const [pmResults, setPmResults] = useState<PubMedResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Manual form fields
  const [title, setTitle]     = useState('');
  const [authors, setAuthors] = useState('');   // comma-separated
  const [journal, setJournal] = useState('');
  const [year, setYear]       = useState('');
  const [abstract, setAbstract] = useState('');
  const [manualDoi, setManualDoi] = useState('');
  const [tags, setTags]       = useState('');

  // Region linking
  const [linkedRegion, setLinkedRegion] = useState(prelinkedRegion ?? '');
  const [regionSearch, setRegionSearch] = useState(
    prelinkedRegion ? regionMap[prelinkedRegion]?.name ?? '' : ''
  );
  const [regionDropOpen, setRegionDropOpen] = useState(false);
  const regionMatches = regionSearch.trim()
    ? brainRegions.filter((r) =>
        r.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
        r.acronym.toLowerCase().includes(regionSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const saveSource = (partial: Partial<Source>) => {
    const source: Source = {
      id: genId(),
      title: partial.title ?? '',
      authors: partial.authors ?? [],
      doi: partial.doi,
      url: partial.url,
      abstract: partial.abstract,
      journal: partial.journal,
      year: partial.year,
      pmid: partial.pmid,
      tags: (tags.split(',').map((t) => t.trim()).filter(Boolean)),
      isGlobal: false,
      createdAt: new Date().toISOString(),
      notes: [],
    };
    addSource(source);

    if (linkedRegion) {
      const regionData = regionMap[linkedRegion];
      const link: StructureLink = {
        id: genId(),
        sourceId: source.id,
        regionMeshName: linkedRegion,
        regionName: regionData?.name ?? linkedRegion,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      addStructureLink(link);
    }
    onClose();
  };

  // DOI auto-fill
  const handleDOILookup = async () => {
    if (!doi.trim()) return;
    setLoading(true); setError('');
    try {
      const result = await lookupDOI(doi.trim());
      if (!result) { setError('DOI not found in CrossRef.'); return; }
      saveSource(result);
    } catch (e: any) {
      setError(e.message ?? 'DOI lookup failed.');
    } finally { setLoading(false); }
  };

  // PubMed search
  const handlePubMedSearch = async () => {
    if (!pmQuery.trim()) return;
    setLoading(true); setError('');
    try {
      const results = await searchPubMed(pmQuery.trim(), 8);
      setPmResults(results);
      if (results.length === 0) setError('No PubMed results found.');
    } catch (e: any) {
      setError(e.message ?? 'PubMed search failed.');
    } finally { setLoading(false); }
  };

  const importPubMed = (r: PubMedResult) => {
    saveSource({
      title: r.title, authors: r.authors, journal: r.journal,
      year: r.year, doi: r.doi,
      // ESummary doesn't return abstracts — store pmid so SourceViewer can fetch via EFetch
      abstract: r.abstract || undefined,
      pmid: r.pmid,
      url: r.doi ? `https://doi.org/${r.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}`,
    });
  };

  const handleManualSave = () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    saveSource({
      title: title.trim(),
      authors: authors.split(',').map((a) => a.trim()).filter(Boolean),
      journal: journal.trim() || undefined,
      year: year ? parseInt(year) : undefined,
      abstract: abstract.trim() || undefined,
      doi: manualDoi.trim() || undefined,
      url: manualDoi.trim() ? `https://doi.org/${manualDoi.trim()}` : undefined,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 12px', marginBottom: 8,
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 480, maxHeight: '85vh', overflowY: 'auto',
        background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 12, padding: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Add Research Source</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([
            { id: 'doi',    label: 'DOI Lookup' },
            { id: 'pubmed', label: 'PubMed Search' },
            { id: 'manual', label: 'Manual Entry' },
          ] as { id: Mode; label: string }[]).map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setError(''); setPmResults([]); }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${mode === m.id ? 'rgba(59,130,246,0.6)' : 'rgba(100,116,139,0.2)'}`,
                background: mode === m.id ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: mode === m.id ? '#60a5fa' : '#475569', cursor: 'pointer',
              }}
            >{m.label}</button>
          ))}
        </div>

        {/* DOI mode */}
        {mode === 'doi' && (
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              Paste a DOI (e.g. 10.1016/j.neuron.2021.01.001) — metadata will be auto-filled from CrossRef.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/xxxxx" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} onKeyDown={(e) => e.key === 'Enter' && handleDOILookup()} />
              <button onClick={handleDOILookup} disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', cursor: 'pointer', flexShrink: 0 }}>
                {loading ? '…' : 'Import'}
              </button>
            </div>
          </div>
        )}

        {/* PubMed mode */}
        {mode === 'pubmed' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={pmQuery} onChange={(e) => setPmQuery(e.target.value)} placeholder="e.g. thalamus working memory fMRI" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} onKeyDown={(e) => e.key === 'Enter' && handlePubMedSearch()} />
              <button onClick={handlePubMedSearch} disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', cursor: 'pointer', flexShrink: 0 }}>
                {loading ? '…' : 'Search'}
              </button>
            </div>
            {pmResults.map((r) => (
              <div key={r.pmid} style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 6, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }} onClick={() => importPubMed(r)}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{r.title}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{r.authors.slice(0,3).join(', ')}{r.authors.length>3?' et al.':''} · {r.journal} · {r.year}</div>
                <div style={{ fontSize: 9, color: '#3b82f6', marginTop: 4 }}>Click to import ↗</div>
              </div>
            ))}
          </div>
        )}

        {/* Manual mode */}
        {mode === 'manual' && (
          <div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" style={inputStyle} />
            <input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Authors (comma-separated)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Journal" style={{ ...inputStyle, flex: 1 }} />
              <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" type="number" style={{ ...inputStyle, width: 80, flex: 'none' }} />
            </div>
            <input value={manualDoi} onChange={(e) => setManualDoi(e.target.value)} placeholder="DOI (optional)" style={inputStyle} />
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Abstract (optional)" rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        )}

        {/* Tags (all modes) */}
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated, e.g. fMRI, memory, cortex)" style={inputStyle} />

        {/* Region link */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={regionSearch}
            onChange={(e) => { setRegionSearch(e.target.value); setLinkedRegion(''); setRegionDropOpen(true); }}
            onFocus={() => setRegionDropOpen(true)}
            placeholder="Link to brain region (optional)"
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          {linkedRegion && (
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 10, color: '#22d3ee' }}>✓ {regionMap[linkedRegion]?.name}</span>
          )}
          {regionDropOpen && regionMatches.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, zIndex: 10, maxHeight: 160, overflowY: 'auto' }}>
              {regionMatches.map((r) => (
                <div key={r.meshName} onClick={() => { setLinkedRegion(r.meshName); setRegionSearch(r.name); setRegionDropOpen(false); }}
                  style={{ padding: '7px 12px', fontSize: 11, color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  {r.name} <span style={{ color: '#475569', fontSize: 9 }}>{r.acronym}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 10 }}>{error}</div>}

        {/* Save button (manual mode only — doi/pubmed save on import) */}
        {mode === 'manual' && (
          <button
            onClick={handleManualSave}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.5)', color: '#60a5fa', cursor: 'pointer' }}
          >
            Save Source
          </button>
        )}
      </div>
    </div>
  );
};

export default AddSourceModal;
