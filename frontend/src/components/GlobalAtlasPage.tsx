import React, { useState, useEffect, useMemo } from 'react';
import { useBrainStore } from '../store/brainStore';
import {
  fetchGlobalContributions, submitGlobalContribution, isSupabaseConfigured,
  type GlobalContribution,
} from '../lib/supabase';
import { verifyRelevance, isGroqConfigured } from '../lib/groqVerification';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const TIER_COLOR: Record<string, string> = {
  approve: '#22c55e',
  review:  '#f59e0b',
  reject:  '#ef4444',
};

// ---------------------------------------------------------------------------
// Contribute modal
// ---------------------------------------------------------------------------
const ContributeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { sources, structureLinks, brainRegions, user } = useBrainStore();
  const [sourceId, setSourceId]     = useState('');
  const [meshName, setMeshName]     = useState('');
  const [status, setStatus]         = useState<'idle'|'verifying'|'submitting'|'done'|'error'>('idle');
  const [verResult, setVerResult]   = useState<{ score: number; explanation: string; tier: string } | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');

  const source = sources.find((s) => s.id === sourceId);
  const region = brainRegions.find((r) => r.meshName === meshName);

  const handleSubmit = async () => {
    if (!source || !region) { setErrorMsg('Select a source and a region.'); return; }
    if (!user)               { setErrorMsg('You must be signed in to contribute.'); return; }
    setErrorMsg(''); setStatus('verifying'); setVerResult(null);

    let aiScore = 50;
    let tier: string = 'review';

    if (isGroqConfigured) {
      const result = await verifyRelevance(source.title, source.abstract ?? '', region.name);
      if (result) {
        aiScore = result.score;
        tier    = result.tier;
        setVerResult(result);
      }
    }

    if (tier === 'reject') {
      setStatus('error');
      setErrorMsg(`AI relevance score: ${aiScore}/100. This source doesn't appear relevant enough to ${region.name} to be contributed to the global atlas.`);
      return;
    }

    setStatus('submitting');
    const { error } = await submitGlobalContribution({
      user_id:     user.id,
      source_id:   source.id,
      region_name: region.name,
      mesh_name:   meshName,
      title:       source.title,
      authors:     source.authors.slice(0, 5).join(', '),
      journal:     source.journal,
      year:        source.year,
      doi:         source.doi,
      abstract:    source.abstract,
      verified:    tier === 'approve',
      ai_score:    aiScore,
    });

    if (error) { setStatus('error'); setErrorMsg(error.message); }
    else       { setStatus('done'); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px',
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 6, color: '#e2e8f0', fontSize: 12, outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(7,11,22,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 500, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Contribute to Global Atlas</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#34d399', marginBottom: 8 }}>Contribution submitted!</div>
            {verResult && (
              <div style={{ fontSize: 12, color: '#64748b' }}>
                AI relevance score: <strong style={{ color: TIER_COLOR[verResult.tier] }}>{verResult.score}/100</strong> — {verResult.explanation}
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: 20, padding: '8px 24px', borderRadius: 6, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>SOURCE</label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={inputStyle}>
                <option value="">Select a source from your library…</option>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.title.slice(0,60)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>BRAIN REGION</label>
              <select value={meshName} onChange={(e) => setMeshName(e.target.value)} style={inputStyle}>
                <option value="">Select a brain region…</option>
                {brainRegions.map((r) => <option key={r.meshName} value={r.meshName}>{r.name} ({r.acronym})</option>)}
              </select>
            </div>

            {verResult && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: `${TIER_COLOR[verResult.tier]}15`, border: `1px solid ${TIER_COLOR[verResult.tier]}44` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TIER_COLOR[verResult.tier], marginBottom: 4 }}>
                  AI Score: {verResult.score}/100 ({verResult.tier === 'approve' ? 'Auto-approve' : 'Flagged for review'})
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{verResult.explanation}</div>
              </div>
            )}

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12 }}>
                {errorMsg}
              </div>
            )}

            {!isSupabaseConfigured() && (
              <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 11 }}>
                Supabase not configured — contributions will not be persisted.
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === 'verifying' || status === 'submitting'}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(30,64,175,0.8))',
                border: '1px solid rgba(59,130,246,0.5)', color: '#e0eaff', fontSize: 14,
                opacity: status !== 'idle' && status !== 'error' ? 0.7 : 1,
              }}
            >
              {status === 'verifying' ? '🤖 Verifying with AI…' : status === 'submitting' ? 'Submitting…' : 'Submit Contribution'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// GlobalAtlasPage
// ---------------------------------------------------------------------------
const GlobalAtlasPage: React.FC = () => {
  const { brainRegions, sources, structureLinks, user, setAppPage, setSelectedRegion } = useBrainStore();
  const [contributions, setContributions] = useState<GlobalContribution[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    setLoading(true);
    fetchGlobalContributions(100)
      .then(setContributions)
      .finally(() => setLoading(false));
  }, []);

  // Heatmap: count contributions per region, normalised 0–1
  const heatmap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contributions) counts[c.mesh_name] = (counts[c.mesh_name] ?? 0) + 1;
    const max = Math.max(1, ...Object.values(counts));
    const norm: Record<string, number> = {};
    for (const [k, v] of Object.entries(counts)) norm[k] = v / max;
    return norm;
  }, [contributions]);

  // Also include local links as part of the local heatmap
  const localHeatmap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of structureLinks) counts[l.regionMeshName] = (counts[l.regionMeshName] ?? 0) + 1;
    const max = Math.max(1, ...Object.values(counts));
    const norm: Record<string, number> = {};
    for (const [k, v] of Object.entries(counts)) norm[k] = v / max;
    return norm;
  }, [structureLinks]);

  const filtered = contributions.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.region_name.toLowerCase().includes(search.toLowerCase())
  );

  // Top regions by contribution count
  const topRegions = useMemo(() => {
    const counts: Record<string, { name: string; meshName: string; count: number }> = {};
    for (const c of contributions) {
      if (!counts[c.mesh_name]) counts[c.mesh_name] = { name: c.region_name, meshName: c.mesh_name, count: 0 };
      counts[c.mesh_name].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [contributions]);

  const statCard = (label: string, value: string | number, color = '#60a5fa') => (
    <div style={{
      flex: 1, padding: '16px 20px', borderRadius: 10,
      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.15)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#475569', marginTop: 3, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Community Atlas</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 5 }}>
            Verified source-to-structure links contributed by the MAPPED community.
          </p>
        </div>
        <button
          onClick={() => user ? setShowContribute(true) : setAppPage('auth')}
          style={{
            padding: '9px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(30,64,175,0.8))',
            border: '1px solid rgba(59,130,246,0.5)', color: '#e0eaff', fontSize: 13,
          }}
        >
          + Contribute
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        {statCard('Global contributions', contributions.length, '#60a5fa')}
        {statCard('Regions covered', Object.keys(heatmap).length, '#34d399')}
        {statCard('Your local links', structureLinks.length, '#c084fc')}
        {statCard('Your sources', sources.length, '#f59e0b')}
      </div>

      {/* Research heatmap legend */}
      <div style={{
        padding: '16px 20px', borderRadius: 10,
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.15)',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12, letterSpacing: 0.6 }}>RESEARCH COVERAGE HEATMAP</div>
        <p style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>
          Regions below are coloured by research coverage: <span style={{ color: '#ef4444' }}>bright red</span> = most studied, <span style={{ color: '#334155' }}>dim</span> = under-researched. The 3D viewer will reflect these colours when you return to the Explorer.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {brainRegions.map((r) => {
            const intensity = heatmap[r.meshName] ?? localHeatmap[r.meshName] ?? 0;
            const red   = Math.round(intensity * 220 + 20);
            const green = Math.round((1 - intensity) * 80);
            const color = intensity > 0 ? `rgb(${red},${green},30)` : 'rgba(30,41,59,0.6)';
            return (
              <button
                key={r.meshName}
                title={`${r.name}: ${Math.round(intensity * 100)}% coverage — click to explore in 3D`}
                onClick={() => { setSelectedRegion(r.meshName); setAppPage('explorer'); }}
                style={{
                  padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                  background: color, color: intensity > 0.3 ? '#fff' : '#334155',
                  border: `1px solid ${intensity > 0 ? 'rgba(255,100,50,0.3)' : 'rgba(30,41,59,0.4)'}`,
                  cursor: 'pointer',
                }}
              >
                {r.acronym}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* Discovery feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6 }}>DISCOVERY FEED</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or region…"
              style={{
                padding: '5px 12px', borderRadius: 6,
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#e2e8f0', fontSize: 11, outline: 'none', width: 200,
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#334155', padding: 40 }}>Loading contributions…</div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: 32, textAlign: 'center',
              background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10,
              color: '#334155', fontSize: 13,
            }}>
              {isSupabaseConfigured()
                ? 'No global contributions yet. Be the first to contribute!'
                : 'Connect Supabase to see community contributions. (REACT_APP_SUPABASE_URL not set)'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((c) => (
                <div key={c.id} style={{
                  padding: '14px 18px', borderRadius: 10,
                  background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 3, lineHeight: 1.4 }}>
                        {c.title.length > 80 ? c.title.slice(0,80) + '…' : c.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                        {c.authors}{c.journal ? ` · ${c.journal}` : ''}{c.year ? ` · ${c.year}` : ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          title={`Explore ${c.region_name} in 3D viewer`}
                          onClick={() => { setSelectedRegion(c.mesh_name); setAppPage('explorer'); }}
                          style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)',
                            color: '#22d3ee', cursor: 'pointer',
                          }}
                        >
                          {c.region_name}
                        </button>
                        {c.ai_score > 0 && (
                          <span style={{ fontSize: 10, color: '#475569' }}>
                            AI: {c.ai_score}/100
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                    </div>
                    {c.verified && (
                      <span title="Verified" style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>✅</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: top regions */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, marginBottom: 14 }}>TOP STUDIED REGIONS</div>
          {topRegions.length === 0 ? (
            <div style={{ fontSize: 11, color: '#334155', padding: '16px 0' }}>No data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRegions.map((r, i) => (
                <button
                  key={r.name}
                  title={`Explore ${r.name} in 3D viewer`}
                  onClick={() => { setSelectedRegion(r.meshName); setAppPage('explorer'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(59,130,246,0.12)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#334155', width: 18, textAlign: 'center', fontWeight: 700 }}>{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{r.count} source{r.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{
                    width: 40, height: 4, borderRadius: 2, background: 'rgba(30,41,59,0.8)', overflow: 'hidden',
                  }}>
                    <div style={{ height: '100%', width: `${heatmap[Object.keys(heatmap).find((k) => k.includes(r.name.slice(0,4))) ?? ''] ?? 0}%`, background: '#3b82f6' }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showContribute && <ContributeModal onClose={() => setShowContribute(false)} />}
    </div>
  );
};

export default GlobalAtlasPage;
