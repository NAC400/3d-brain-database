import React, { useState } from 'react';
import type { Source, StructureLink } from '../store/brainStore';
import { useBrainStore } from '../store/brainStore';

interface Props {
  source: Source;
  linkedRegions?: StructureLink[];
  onSelect?: () => void;
  compact?: boolean;
}

const SourceCard: React.FC<Props> = ({ source, linkedRegions = [], onSelect, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const { removeSource, removeStructureLink, setSelectedRegion, setCameraTarget, regionCentroids, setViewingSourceId } = useBrainStore();

  const ZOOM_DISTANCE = 0.6;

  const jumpToRegion = (meshName: string) => {
    setSelectedRegion(meshName);
    const c = regionCentroids[meshName];
    if (c) setCameraTarget({ position: [c[0], c[1], c[2] + ZOOM_DISTANCE], lookAt: [c[0], c[1], c[2]] });
  };

  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: 8,
      padding: compact ? '8px 10px' : '12px 14px',
      marginBottom: 8,
    }}>
      {/* Title + actions row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, cursor: 'pointer' }}
            onClick={() => { setViewingSourceId(source.id); onSelect?.(); }}
            title="Open source detail"
          >
            {source.title}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
            {source.authors.slice(0,3).join(', ')}{source.authors.length > 3 ? ' et al.' : ''}
            {source.journal && <span> · <em>{source.journal}</em></span>}
            {source.year ? <span> · {source.year}</span> : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {source.doi && (
            <a
              href={`https://doi.org/${source.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open paper"
              style={{
                padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa', textDecoration: 'none', letterSpacing: 0.4,
              }}
            >
              DOI ↗
            </a>
          )}
          <button
            onClick={() => {
              if (window.confirm('Remove this source?')) removeSource(source.id);
            }}
            style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 10, lineHeight: 1,
              background: 'transparent', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', cursor: 'pointer',
            }}
          >×</button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && !compact && (
        <div style={{ marginTop: 10 }}>
          {source.abstract && (
            <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 10px' }}>
              {source.abstract.length > 300 ? source.abstract.slice(0, 300) + '…' : source.abstract}
            </p>
          )}

          {/* Tags */}
          {source.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {source.tags.map((t) => (
                <span key={t} style={{
                  padding: '1px 6px', borderRadius: 3, fontSize: 9,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc',
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* Linked regions */}
          {linkedRegions.length > 0 && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Linked Regions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {linkedRegions.map((link) => (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <button
                      onClick={() => jumpToRegion(link.regionMeshName)}
                      style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
                        color: '#22d3ee', cursor: 'pointer',
                      }}
                    >
                      {link.regionName}
                    </button>
                    <button
                      onClick={() => removeStructureLink(link.id)}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: 0 }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceCard;
