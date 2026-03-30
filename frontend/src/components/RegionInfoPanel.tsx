import React from 'react';
import { useBrainStore } from '../store/brainStore';

const RegionInfoPanel: React.FC = () => {
  const { selectedRegion, regionMap, setSelectedRegion, setIsolatedRegion, isolatedRegion } =
    useBrainStore();

  const region = selectedRegion ? regionMap[selectedRegion] : null;

  if (!region) return null;

  const isIsolated = isolatedRegion === selectedRegion;

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 280,
        zIndex: 40,
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        padding: '16px 18px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Color swatch */}
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: region.color,
            flexShrink: 0,
            marginTop: 2,
            boxShadow: `0 0 6px ${region.color}88`,
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: '#f1f5f9' }}>
              {region.name}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 0.5, marginTop: 1 }}>
              {region.acronym}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setSelectedRegion(null); setIsolatedRegion(null); }}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 6 }}
        >
          ×
        </button>
      </div>

      {/* Category badge */}
      <div style={{ marginBottom: 10 }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.6,
          background: 'rgba(59,130,246,0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.25)',
          textTransform: 'uppercase',
        }}>
          {region.category}
        </span>
      </div>

      {/* Metadata */}
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
        {region.parentName && (
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ color: '#475569', minWidth: 64 }}>Parent</span>
            <span style={{ color: '#cbd5e1' }}>{region.parentName}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: '#475569', minWidth: 64 }}>Depth</span>
          <span style={{ color: '#cbd5e1' }}>Level {region.depth}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: '#475569', minWidth: 64 }}>Label ID</span>
          <span style={{ color: '#cbd5e1' }}>{region.labelId}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(30,64,175,0.3)', marginBottom: 12 }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setIsolatedRegion(isIsolated ? null : selectedRegion)}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: '1px solid rgba(59,130,246,0.4)',
            background: isIsolated ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.08)',
            color: isIsolated ? '#93c5fd' : '#3b82f6',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: 0.4,
          }}
        >
          {isIsolated ? 'Show All' : 'Isolate'}
        </button>
        <button
          onClick={() => { setSelectedRegion(null); setIsolatedRegion(null); }}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: '1px solid rgba(100,116,139,0.3)',
            background: 'transparent',
            color: '#64748b',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: 0.4,
          }}
        >
          Deselect
        </button>
      </div>
    </div>
  );
};

export default RegionInfoPanel;
