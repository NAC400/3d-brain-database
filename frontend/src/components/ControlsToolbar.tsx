import React, { useState, useRef, useEffect } from 'react';
import { useBrainStore } from '../store/brainStore';
import type { BrainBounds } from '../store/brainStore';

// ---------------------------------------------------------------------------
// Category hierarchy
// ---------------------------------------------------------------------------

interface CategoryGroup {
  id:       string;
  label:    string;
  color:    string;
  children: readonly string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'telencephalon', label: 'Telencephalon', color: '#f59e0b',
    children: [
      'Telencephalon – Frontal Lobe',
      'Telencephalon – Parietal Lobe',
      'Telencephalon – Temporal Lobe',
      'Telencephalon – Occipital Lobe',
      'Telencephalon – Limbic Lobe',
      'Telencephalon – Insula',
      'Telencephalon – Hippocampus & Amygdala',
      'Telencephalon – Basal Ganglia',
      'Telencephalon – Cerebral Nuclei',
      'Telencephalon – Olfactory / Paleocortex',
      'Telencephalon – Cortex (Other)',
    ],
  },
  {
    id: 'diencephalon', label: 'Diencephalon', color: '#3b82f6',
    children: ['Diencephalon'],
  },
  {
    id: 'brainstem', label: 'Brainstem', color: '#10b981',
    children: [
      'Mesencephalon (Midbrain)',
      'Metencephalon (Pons)',
      'Myelencephalon (Medulla)',
    ],
  },
  {
    id: 'cerebellum', label: 'Cerebellum', color: '#f97316',
    children: ['Metencephalon (Cerebellum)'],
  },
  {
    id: 'whiteMatter', label: 'White Matter', color: '#94a3b8',
    children: ['White Matter'],
  },
  {
    id: 'ventricles', label: 'Ventricles & CSF', color: '#60a5fa',
    children: ['Ventricles & CSF'],
  },
];

// Strip "Telencephalon – " prefix for compact sub-labels
const shortLabel = (cat: string) => cat.replace(/^Telencephalon\s*[–-]\s*/i, '');

const SUB_COLORS: Record<string, string> = {
  'Telencephalon – Frontal Lobe':           '#f59e0b',
  'Telencephalon – Parietal Lobe':          '#a78bfa',
  'Telencephalon – Temporal Lobe':          '#ec4899',
  'Telencephalon – Occipital Lobe':         '#22d3ee',
  'Telencephalon – Limbic Lobe':            '#f472b6',
  'Telencephalon – Insula':                 '#fb923c',
  'Telencephalon – Hippocampus & Amygdala': '#e879f9',
  'Telencephalon – Basal Ganglia':          '#8b5cf6',
  'Telencephalon – Cerebral Nuclei':        '#a3e635',
  'Telencephalon – Olfactory / Paleocortex':'#34d399',
  'Telencephalon – Cortex (Other)':         '#fbbf24',
  'Mesencephalon (Midbrain)':               '#10b981',
  'Metencephalon (Pons)':                   '#6ee7b7',
  'Myelencephalon (Medulla)':               '#059669',
};

// ---------------------------------------------------------------------------
// Upward-opening sub-category popover
// ---------------------------------------------------------------------------

interface PopoverProps {
  group:            CategoryGroup;
  activeCategories: Set<string>;
  toggleCategory:   (cat: string) => void;
  onClose:          () => void;
  anchorRef:        React.RefObject<HTMLButtonElement | null>;
}

const SubPopover: React.FC<PopoverProps> = ({ group, activeCategories, toggleCategory, onClose, anchorRef }) => {
  const popRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pos, setPos] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      // Pop upward from the top of the anchor button; 8px gap
      setPos({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const allActive = group.children.every((c) => activeCategories.has(c));

  return (
    <div
      ref={popRef}
      style={{
        position: 'fixed',
        left: pos.left,
        bottom: pos.bottom,
        zIndex: 500,
        background: 'rgba(15,23,42,0.97)',
        border: `1px solid ${group.color}44`,
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        minWidth: 240,
        maxWidth: 320,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: group.color, letterSpacing: 0.5 }}>
            {group.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Select all / deselect all */}
          <button
            onClick={() => {
              if (allActive) {
                group.children.forEach((c) => { if (activeCategories.has(c)) toggleCategory(c); });
              } else {
                group.children.forEach((c) => { if (!activeCategories.has(c)) toggleCategory(c); });
              }
            }}
            style={{
              fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${group.color}55`,
              color: group.color, letterSpacing: 0.3,
            }}
          >
            {allActive ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Sub-chips — wrapped grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {group.children.map((cat) => {
          const active = activeCategories.has(cat);
          const color  = SUB_COLORS[cat] ?? group.color;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 5,
                border: `1px solid ${active ? color + '88' : 'rgba(100,116,139,0.2)'}`,
                background: active ? color + '22' : 'rgba(15,23,42,0.5)',
                color: active ? color : '#64748b',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active ? color : '#334155', flexShrink: 0,
              }} />
              {shortLabel(cat)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Axis config for cross-section
// ---------------------------------------------------------------------------

const AXES = [
  { key: 'sagittal' as const, label: 'Sagittal', sublabel: 'L ↔ R',      color: '#f87171', boundsMin: 'xMin' as keyof BrainBounds, boundsMax: 'xMax' as keyof BrainBounds },
  { key: 'axial'    as const, label: 'Axial',    sublabel: 'Sup ↔ Inf',  color: '#34d399', boundsMin: 'yMin' as keyof BrainBounds, boundsMax: 'yMax' as keyof BrainBounds },
  { key: 'coronal'  as const, label: 'Coronal',  sublabel: 'Ant ↔ Post', color: '#60a5fa', boundsMin: 'zMin' as keyof BrainBounds, boundsMax: 'zMax' as keyof BrainBounds },
] as const;

// ---------------------------------------------------------------------------
// ControlsToolbar
// ---------------------------------------------------------------------------

const ControlsToolbar: React.FC = () => {
  const {
    explodeAmount, setExplodeAmount,
    activeCategories, toggleCategory,
    clippingPlanes, planeEnabled,
    setClippingPlane, setPlaneEnabled, resetClipping,
    showMirroredHemisphere, setShowMirroredHemisphere,
    brainBounds,
  } = useBrainStore();

  const [mode, setMode]           = useState<'layers' | 'crosssection'>('layers');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // One ref per group button so the popover can anchor to it
  const btnRefs = useRef<Record<string, React.RefObject<HTMLButtonElement | null>>>({});
  CATEGORY_GROUPS.forEach((g) => {
    if (!btnRefs.current[g.id]) btnRefs.current[g.id] = React.createRef<HTMLButtonElement | null>();
  });

  const anyPlaneEnabled = planeEnabled.sagittal || planeEnabled.axial || planeEnabled.coronal;

  const groupIsActive  = (g: CategoryGroup) => g.children.some((c) => activeCategories.has(c));

  const handleGroupClick = (group: CategoryGroup) => {
    if (group.children.length === 1) {
      // Single-child: toggle directly, no popover
      toggleCategory(group.children[0]);
    } else {
      setOpenGroup(openGroup === group.id ? null : group.id);
    }
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        height: '100%',
        overflowX: 'visible',
        flexWrap: 'nowrap',
        width: '100%',
        gap: 0,
      }}>

        {/* ── Full Brain toggle ── */}
        <button
          onClick={() => setShowMirroredHemisphere(!showMirroredHemisphere)}
          title="Mirror the hemisphere to show a full brain"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 5, flexShrink: 0, marginRight: 12,
            border: `1px solid ${showMirroredHemisphere ? 'rgba(34,211,238,0.6)' : 'rgba(100,116,139,0.3)'}`,
            background: showMirroredHemisphere ? 'rgba(34,211,238,0.12)' : 'transparent',
            color: showMirroredHemisphere ? '#22d3ee' : '#475569',
            fontSize: 10, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5,
            textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: showMirroredHemisphere ? '#22d3ee' : '#334155', flexShrink: 0 }} />
          Full Brain
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(30,64,175,0.4)', marginRight: 12, flexShrink: 0 }} />

        {/* ── Explode slider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginRight: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: '#3b82f6', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Explode
          </span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={explodeAmount}
            onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
            style={{ width: 90, accentColor: '#3b82f6', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10, color: '#475569', width: 26, flexShrink: 0 }}>
            {Math.round(explodeAmount * 100)}%
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(30,64,175,0.4)', marginRight: 12, flexShrink: 0 }} />

        {/* ── Mode toggle ── */}
        <div style={{ display: 'flex', gap: 4, marginRight: 14, flexShrink: 0 }}>
          {(['layers', 'crosssection'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '3px 10px', borderRadius: 5,
                border: `1px solid ${mode === m ? 'rgba(59,130,246,0.7)' : 'rgba(100,116,139,0.25)'}`,
                background: mode === m ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: mode === m ? '#60a5fa' : '#475569',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}
            >
              {m === 'layers' ? 'Layers' : 'Cross Section'}
            </button>
          ))}
        </div>

        {/* ── Layer group buttons ── */}
        {mode === 'layers' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', flexShrink: 0 }}>

            {/* Clear filter badge */}
            {activeCategories.size > 0 && (
              <button
                onClick={() => Array.from(activeCategories).forEach((c) => toggleCategory(c))}
                title="Clear filter — show all regions"
                style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                  color: '#f87171', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  letterSpacing: 0.3,
                }}
              >
                ✕ Clear ({activeCategories.size})
              </button>
            )}

            {CATEGORY_GROUPS.map((group) => {
              const isActive   = groupIsActive(group);
              const isOpen     = openGroup === group.id;
              const hasChildren = group.children.length > 1;

              return (
                <button
                  key={group.id}
                  ref={btnRefs.current[group.id]}
                  onClick={() => handleGroupClick(group)}
                  title={hasChildren ? `Filter by ${group.label}` : group.children[0]}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 4,
                    border: `1px solid ${isActive || isOpen ? group.color + '66' : 'rgba(100,116,139,0.2)'}`,
                    background: isActive || isOpen ? group.color + '18' : 'transparent',
                    color: isActive || isOpen ? group.color : '#475569',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    opacity: (activeCategories.size > 0 && !isActive) ? 0.4 : 1,
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: isActive || isOpen ? group.color : '#334155', flexShrink: 0,
                  }} />
                  {group.label}
                  {hasChildren && (
                    <span style={{ fontSize: 8, opacity: 0.6 }}>{isOpen ? '▲' : '▾'}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Cross-section panel ── */}
        {mode === 'crosssection' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'nowrap' }}>
            {AXES.map(({ key, label, sublabel, color, boundsMin, boundsMax }) => {
              const enabled      = planeEnabled[key];
              const PADDING      = 0.05;
              const sliderMin    = brainBounds ? brainBounds[boundsMin] - PADDING : -2;
              const sliderMax    = brainBounds ? brainBounds[boundsMax] + PADDING : 2;
              const clampedValue = Math.max(sliderMin, Math.min(sliderMax, clippingPlanes[key]));

              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setPlaneEnabled(key, !enabled)}
                    title={`Enable ${label} plane`}
                    style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                      border: `2px solid ${enabled ? color : 'rgba(100,116,139,0.35)'}`,
                      background: enabled ? color : 'transparent', padding: 0,
                    }}
                  />
                  <div style={{ opacity: enabled ? 1 : 0.4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color, textTransform: 'uppercase', lineHeight: 1 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 8, color: '#334155', lineHeight: 1, marginTop: 1 }}>{sublabel}</div>
                  </div>
                  <input
                    type="range"
                    min={sliderMin} max={sliderMax} step={0.001}
                    value={clampedValue}
                    onChange={(e) => {
                      if (!planeEnabled[key]) setPlaneEnabled(key, true);
                      setClippingPlane(key, parseFloat(e.target.value));
                    }}
                    style={{ width: 90, accentColor: color, cursor: 'pointer', opacity: enabled ? 1 : 0.35 }}
                  />
                  <span style={{ fontSize: 9, color: '#475569', width: 36, flexShrink: 0, opacity: enabled ? 1 : 0.35 }}>
                    {clampedValue.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {anyPlaneEnabled && (
              <button
                onClick={resetClipping}
                style={{
                  padding: '3px 10px', borderRadius: 5, flexShrink: 0,
                  border: '1px solid rgba(248,113,113,0.35)',
                  background: 'transparent', color: '#f87171',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  letterSpacing: 0.4, whiteSpace: 'nowrap',
                }}
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Sub-category popover (rendered outside the toolbar to avoid overflow) ── */}
      {openGroup && (() => {
        const group = CATEGORY_GROUPS.find((g) => g.id === openGroup);
        if (!group || group.children.length <= 1) return null;
        return (
          <SubPopover
            group={group}
            activeCategories={activeCategories}
            toggleCategory={toggleCategory}
            onClose={() => setOpenGroup(null)}
            anchorRef={btnRefs.current[openGroup] as React.RefObject<HTMLButtonElement>}
          />
        );
      })()}
    </>
  );
};

export default ControlsToolbar;
