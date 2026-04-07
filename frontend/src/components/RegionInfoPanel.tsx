import React, { useState } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { Note } from '../types/source';
import { NoteList } from './NoteEditor';

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const RegionInfoPanel: React.FC = () => {
  const {
    selectedRegion, regionMap, setSelectedRegion, setIsolatedRegion, isolatedRegion,
    regionDescriptions, structureNotes, addStructureNote, updateStructureNote, removeStructureNote,
    highlightColors, setHighlightColor, highlightMode, setHighlightMode,
  } = useBrainStore();

  const [showNotes, setShowNotes] = useState(false);

  const region = selectedRegion ? regionMap[selectedRegion] : null;

  if (!region) return null;

  const isIsolated = isolatedRegion === selectedRegion;
  const description = region.labelId ? regionDescriptions[region.labelId] : undefined;
  const notes = structureNotes[region.meshName] ?? [];
  const highlightColor = highlightColors[region.meshName];

  const addNote = () => {
    const now = new Date().toISOString();
    const note: Note = { id: genId(), content: '', createdAt: now, updatedAt: now, versions: [] };
    addStructureNote(region.meshName, note);
    setShowNotes(true);
  };

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

      {/* Anatomical description from Allen Atlas */}
      {description && (
        <div style={{
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 6,
          padding: '8px 10px',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>
            Description
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(30,64,175,0.3)', marginBottom: 12 }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => setIsolatedRegion(isIsolated ? null : selectedRegion)}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 6,
            border: '1px solid rgba(59,130,246,0.4)',
            background: isIsolated ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.08)',
            color: isIsolated ? '#93c5fd' : '#3b82f6',
            fontSize: 11, cursor: 'pointer', fontWeight: 600, letterSpacing: 0.4,
          }}
        >
          {isIsolated ? 'Show All' : 'Isolate'}
        </button>
        <button
          onClick={() => { setSelectedRegion(null); setIsolatedRegion(null); }}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 6,
            border: '1px solid rgba(100,116,139,0.3)',
            background: 'transparent', color: '#64748b',
            fontSize: 11, cursor: 'pointer', fontWeight: 600, letterSpacing: 0.4,
          }}
        >
          Deselect
        </button>
      </div>

      {/* Highlight color + paint mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: 0.4 }}>Highlight</span>
        <input
          type="color"
          value={highlightColor ?? region.color}
          onChange={(e) => setHighlightColor(region.meshName, e.target.value)}
          title="Custom highlight color"
          style={{ width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
        />
        {highlightColor && (
          <button
            onClick={() => setHighlightColor(region.meshName, null)}
            style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 3,
              background: 'transparent', border: '1px solid rgba(100,116,139,0.2)',
              color: '#475569', cursor: 'pointer',
            }}
          >Reset</button>
        )}
        <button
          onClick={() => setHighlightMode(!highlightMode)}
          title="Toggle paint mode — click regions to set their colour"
          style={{
            marginLeft: 'auto', fontSize: 9, padding: '2px 7px', borderRadius: 3,
            background: highlightMode ? 'rgba(34,211,238,0.15)' : 'transparent',
            border: `1px solid ${highlightMode ? 'rgba(34,211,238,0.4)' : 'rgba(100,116,139,0.2)'}`,
            color: highlightMode ? '#22d3ee' : '#475569', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {highlightMode ? '🖌 Painting' : '🖌 Paint'}
        </button>
      </div>

      {/* Structure notes */}
      <div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
            fontSize: 10, fontWeight: 700, letterSpacing: 0.6, padding: '4px 0',
            textTransform: 'uppercase',
          }}
        >
          <span>Notes {notes.length > 0 ? `(${notes.length})` : ''}</span>
          <span style={{ fontSize: 8 }}>{showNotes ? '▲' : '▾'}</span>
        </button>
        {showNotes && (
          <div style={{ marginTop: 6 }}>
            <NoteList
              notes={notes}
              onAdd={addNote}
              onSave={(id, content) => updateStructureNote(region.meshName, id, content)}
              onDelete={(id) => removeStructureNote(region.meshName, id)}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionInfoPanel;
