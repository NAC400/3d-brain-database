import React, { useEffect, useRef } from 'react';
import { useBrainStore } from '../store/brainStore';

const ContextMenu: React.FC = () => {
  const {
    contextMenu, setContextMenu,
    regionMap, setSelectedRegion, setIsolatedRegion,
    addStructureNote, setViewingSourceId, sources, structureLinks,
    setHighlightColor, highlightColors,
  } = useBrainStore();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setContextMenu(null);
    };
    if (contextMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const { meshName, x, y } = contextMenu;
  const region = regionMap[meshName];
  if (!region) return null;

  const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const linked = structureLinks.filter((l) => l.regionMeshName === meshName);
  const firstSource = linked.length > 0 ? sources.find((s) => s.id === linked[0].sourceId) : null;

  const close = () => setContextMenu(null);

  const item = (label: string, onClick: () => void, color = '#94a3b8') => (
    <button
      key={label}
      onClick={() => { onClick(); close(); }}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '7px 14px', background: 'none', border: 'none',
        color, fontSize: 12, cursor: 'pointer',
        borderRadius: 4,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      {label}
    </button>
  );

  // Keep menu within viewport
  const menuW = 200, menuH = 220;
  const left = x + menuW > window.innerWidth  ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', left, top, zIndex: 1000,
        background: 'rgba(15,23,42,0.98)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 8, padding: '6px 4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        minWidth: menuW,
      }}
    >
      {/* Header */}
      <div style={{ padding: '4px 14px 8px', borderBottom: '1px solid rgba(30,41,59,0.8)', marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>{region.name}</div>
        <div style={{ fontSize: 9, color: '#475569', letterSpacing: 0.5 }}>{region.acronym} · {region.category}</div>
      </div>

      {item('Select', () => setSelectedRegion(meshName), '#60a5fa')}
      {item('Isolate region', () => { setSelectedRegion(meshName); setIsolatedRegion(meshName); }, '#60a5fa')}

      <div style={{ height: 1, background: 'rgba(30,41,59,0.8)', margin: '4px 8px' }} />

      {item('Add note', () => {
        const now = new Date().toISOString();
        addStructureNote(meshName, { id: genId(), content: '', createdAt: now, updatedAt: now, versions: [] });
        setSelectedRegion(meshName);
      })}

      {firstSource && item(`View source: ${firstSource.title.slice(0, 28)}…`, () => setViewingSourceId(firstSource.id), '#a5b4fc')}

      <div style={{ height: 1, background: 'rgba(30,41,59,0.8)', margin: '4px 8px' }} />

      <div style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#475569' }}>Highlight</span>
        <input
          type="color"
          defaultValue={highlightColors[meshName] ?? region.color}
          onChange={(e) => setHighlightColor(meshName, e.target.value)}
          style={{ width: 22, height: 22, border: 'none', cursor: 'pointer', background: 'none', borderRadius: 4 }}
        />
        {highlightColors[meshName] && (
          <button
            onClick={() => { setHighlightColor(meshName, null); close(); }}
            style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'transparent', border: '1px solid rgba(100,116,139,0.2)', color: '#475569', cursor: 'pointer' }}
          >Clear</button>
        )}
      </div>
    </div>
  );
};

export default ContextMenu;
