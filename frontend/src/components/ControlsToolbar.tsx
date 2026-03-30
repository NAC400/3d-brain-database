import React, { useState } from 'react';
import { useBrainStore, ALL_CATEGORIES } from '../store/brainStore';
import type { BrainBounds } from '../store/brainStore';

const CATEGORY_COLORS: Record<string, string> = {
  'Cortex':                    '#f59e0b',
  'Basal Ganglia':             '#8b5cf6',
  'Limbic':                    '#ec4899',
  'Diencephalon':              '#3b82f6',
  'Brainstem':                 '#10b981',
  'Cerebellum':                '#f97316',
  'White Matter & Ventricles': '#94a3b8',
  'Subcortical':               '#06b6d4',
};

// Correct axis assignments for Three.js world space (Y-up, camera from front along Z):
//   X → Left / Right   = Sagittal plane
//   Y → Superior / Inf = Axial plane
//   Z → Ant / Post     = Coronal plane
const AXES = [
  { key: 'sagittal' as const, label: 'Sagittal', sublabel: 'L ↔ R',      color: '#f87171', boundsMin: 'xMin' as keyof BrainBounds, boundsMax: 'xMax' as keyof BrainBounds },
  { key: 'axial'    as const, label: 'Axial',    sublabel: 'Sup ↔ Inf',  color: '#34d399', boundsMin: 'yMin' as keyof BrainBounds, boundsMax: 'yMax' as keyof BrainBounds },
  { key: 'coronal'  as const, label: 'Coronal',  sublabel: 'Ant ↔ Post', color: '#60a5fa', boundsMin: 'zMin' as keyof BrainBounds, boundsMax: 'zMax' as keyof BrainBounds },
] as const;

const ControlsToolbar: React.FC = () => {
  const {
    explodeAmount, setExplodeAmount,
    hiddenCategories, toggleCategory,
    clippingPlanes, planeEnabled,
    setClippingPlane, setPlaneEnabled, resetClipping,
    showMirroredHemisphere, setShowMirroredHemisphere,
    brainBounds,
  } = useBrainStore();

  const [mode, setMode] = useState<'layers' | 'crosssection'>('layers');

  const anyPlaneEnabled = planeEnabled.sagittal || planeEnabled.axial || planeEnabled.coronal;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      height: '100%',
      overflowX: 'auto',
      flexWrap: 'nowrap',
      width: '100%',
      gap: 0,
    }}>

      {/* ── Full Brain toggle (always visible) ── */}
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

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(30,64,175,0.4)', marginRight: 12, flexShrink: 0 }} />

      {/* ── Explode slider (always visible) ── */}
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

      {/* Divider */}
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

      {/* ── Layer toggles ── */}
      {mode === 'layers' && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
          {ALL_CATEGORIES.map((cat) => {
            const hidden = hiddenCategories.has(cat);
            const color  = CATEGORY_COLORS[cat] ?? '#94a3b8';
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                title={cat}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 4,
                  border: `1px solid ${hidden ? 'rgba(100,116,139,0.2)' : color + '55'}`,
                  background: hidden ? 'transparent' : color + '18',
                  color: hidden ? '#334155' : color,
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', opacity: hidden ? 0.45 : 1,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: hidden ? '#334155' : color, flexShrink: 0 }} />
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Cross-section panel ── */}
      {mode === 'crosssection' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'nowrap' }}>

          {AXES.map(({ key, label, sublabel, color, boundsMin, boundsMax }) => {
            const enabled = planeEnabled[key];
            // Use actual brain bounds ± 10% padding; fall back to ±2 until bounds are known
            const PADDING = 0.05;
            const sliderMin = brainBounds ? brainBounds[boundsMin] - PADDING : -2;
            const sliderMax = brainBounds ? brainBounds[boundsMax] + PADDING : 2;
            // Clamp current value to valid range
            const clampedValue = Math.max(sliderMin, Math.min(sliderMax, clippingPlanes[key]));

            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

                {/* Per-axis enable toggle */}
                <button
                  onClick={() => setPlaneEnabled(key, !enabled)}
                  title={`Enable ${label} plane`}
                  style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: `2px solid ${enabled ? color : 'rgba(100,116,139,0.35)'}`,
                    background: enabled ? color : 'transparent',
                    padding: 0,
                  }}
                />

                {/* Label */}
                <div style={{ opacity: enabled ? 1 : 0.4 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color, textTransform: 'uppercase', lineHeight: 1 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 8, color: '#334155', lineHeight: 1, marginTop: 1 }}>{sublabel}</div>
                </div>

                {/* Slider — drag right to cut more */}
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

          {/* Reset all planes */}
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
  );
};

export default ControlsToolbar;
