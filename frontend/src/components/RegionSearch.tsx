import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBrainStore } from '../store/brainStore';

// Camera pull-back distance from the region centroid
const ZOOM_DISTANCE = 0.5;

const RegionSearch: React.FC = () => {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  const {
    brainRegions,
    setSelectedRegion,
    setIsolatedRegion,
    regionCentroids,
    regionCentroidDirs,
    setCameraTarget,
  } = useBrainStore();

  // Fuzzy match — filter by name or acronym substring (case-insensitive)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return brainRegions
      .filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.acronym.toLowerCase().includes(q)
      )
      .slice(0, 12);   // cap dropdown at 12
  }, [query, brainRegions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /**
   * Fly the camera to a region's centroid, approaching from the region's
   * outward direction so it's always visible. No auto-explode — the user
   * controls explode separately with the slider.
   */
  const flyToRegion = (meshName: string) => {
    const c = regionCentroids[meshName];
    if (!c) return;
    const d = regionCentroidDirs[meshName];
    // Normalise the outward direction (mean-centred dirs may not be unit length)
    const [dx, dy, dz] = d ?? [0, 0, 1];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    setCameraTarget({
      position: [c[0] + (dx / len) * ZOOM_DISTANCE, c[1] + (dy / len) * ZOOM_DISTANCE, c[2] + (dz / len) * ZOOM_DISTANCE],
      lookAt:   [c[0], c[1], c[2]],
    });
  };

  const selectRegion = (meshName: string) => {
    setQuery('');
    setOpen(false);
    setSelectedRegion(meshName);
    flyToRegion(meshName);
  };

  const isolateRegion = (meshName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRegion(meshName);
    setIsolatedRegion(meshName);
    setQuery('');
    setOpen(false);
    flyToRegion(meshName);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Search input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 10, color: '#475569', fontSize: 13, pointerEvents: 'none',
        }}>
          ⌕
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search brain region…"
          style={{
            width: 210,
            padding: '6px 12px 6px 30px',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 12,
            outline: 'none',
            boxShadow: open ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            if (e.key === 'Enter' && results.length > 0) selectRegion(results[0].meshName);
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            style={{
              position: 'absolute', right: 8, background: 'none', border: 'none',
              color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
            }}
          >×</button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 8,
          backdropFilter: 'blur(12px)',
          zIndex: 200,
          maxHeight: 320,
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map((region) => (
            <div
              key={region.meshName}
              onClick={() => selectRegion(region.meshName)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(30,41,59,0.6)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {/* Color swatch */}
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: region.color, flexShrink: 0,
                  boxShadow: `0 0 4px ${region.color}88`,
                }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {region.name}
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', letterSpacing: 0.5 }}>
                    {region.acronym} · {region.category}
                  </div>
                </div>
              </div>

              {/* Isolate button */}
              <button
                onClick={(e) => isolateRegion(region.meshName, e)}
                title="Isolate this region"
                style={{
                  flexShrink: 0, marginLeft: 8,
                  padding: '2px 7px', borderRadius: 4,
                  border: '1px solid rgba(59,130,246,0.35)',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#60a5fa', fontSize: 9, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: 0.4,
                }}
              >
                Isolate
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim() && results.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8, padding: '12px', color: '#475569', fontSize: 11, textAlign: 'center',
          zIndex: 200,
        }}>
          No regions match "{query}"
        </div>
      )}
    </div>
  );
};

export default RegionSearch;
