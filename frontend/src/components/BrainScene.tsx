import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import BrainModel from './BrainModel';
import ClippingController from './ClippingController';
import CameraController from './CameraController';
import { useBrainStore } from '../store/brainStore';
import ExperimentalHeadLayers, { HeadLayerOptions, headRegions, isHeadRegionVisible } from './ExperimentalHeadLayers';
import './ExperimentalHeadLayers.css';

// ---------------------------------------------------------------------------
// GLB load progress bar — shown inside the Canvas via Html
// ---------------------------------------------------------------------------
const ProgressFallback: React.FC = () => {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        fontFamily: 'sans-serif',
      }}>
        <div style={{ color: '#60a5fa', fontSize: 13, letterSpacing: 0.5 }}>
          Loading brain model…
        </div>
        <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
            borderRadius: 2,
            transition: 'width 0.2s',
          }} />
        </div>
        <div style={{ color: '#475569', fontSize: 11 }}>{Math.round(progress)}%</div>
      </div>
    </Html>
  );
};

// A failed optional asset must not take down the existing brain viewer.
class HeadLayerBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <Html center><span className="head-layer-loading" role="alert">Head layers could not load. Turn the preview off to continue.</span></Html>
      : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// BrainScene
// ---------------------------------------------------------------------------
const BrainScene: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const atlas = useBrainStore(state => state.brainAtlas);
  const explodeAmount = useBrainStore(state => state.explodeAmount);
  const selectedRegion = useBrainStore(state => state.selectedRegion);
  const [origin, setOrigin] = useState<{ atlas: 'spl' | 'allen'; offset: THREE.Vector3 } | null>(null);
  const receiveOrigin = useCallback((offset: THREE.Vector3) => setOrigin({ atlas, offset }), [atlas]);
  const [head, setHead] = useState<HeadLayerOptions>({ enabled: false, skull: true, arteries: true, veins: false, central: false, folds: false, sinuses: false, skullOpacity: 0.2, vesselOpacity: 0.85, foldOpacity: 0.45 });
  const toggle = (key: 'enabled' | 'skull' | 'arteries' | 'veins' | 'central' | 'folds' | 'sinuses') => setHead(current => ({ ...current, [key]: !current[key] }));

  return (
    /*
     * Inline styles only — no Tailwind. The parent (App.tsx grid middle row) has
     * position:relative, so inset:0 here stretches this div to fill it completely.
     */
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Canvas
        // Each atlas has a different extent/origin. Start its scene with the
        // standard view rather than inheriting a zoom inside the previous brain.
        key={atlas}
        style={{ display: 'block', width: '100%', height: '100%' }}
        camera={{
          position: atlas === 'spl' ? [0, 0, 3] : [0, 0, 4.5],
          fov: 50,
          near: 0.01,
          far: 500,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        // "demand" only re-renders when invalidate() is called or Three.js objects change.
        // The OrbitControls and BrainModel both call invalidate automatically via R3F internals,
        // so interaction stays responsive while idle frames are skipped.
        frameloop="demand"
      >
        {/* Clipping plane controller — reads store, updates gl.clippingPlanes */}
        <ClippingController />

        {/* Camera animation controller — reads cameraTarget from store, lerps camera */}
        <CameraController />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]}   intensity={1.2} />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} />
        <pointLight       position={[0, 10, 0]}   intensity={0.6} />

        <Suspense fallback={<ProgressFallback />}>
          <Environment preset="studio" />
          <BrainModel key={atlas} atlas={atlas} onOrigin={receiveOrigin} />
        </Suspense>

        {/* Separate suspense boundary keeps the brain visible while optional assets load. */}
        {atlas === 'spl' && head.enabled && origin?.atlas === atlas && explodeAmount === 0 && <HeadLayerBoundary><Suspense fallback={<Html center><span className="head-layer-loading">Loading experimental head layers…</span></Html>}>
          <ExperimentalHeadLayers options={head} origin={origin.offset} />
        </Suspense></HeadLayerBoundary>}

        {/* Controls outside Suspense — responsive before GLB finishes */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          panSpeed={0.8}
          enablePan
          enableZoom
          enableRotate
          minDistance={0.3}
          maxDistance={10}
          mouseButtons={{
            LEFT:   THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT:  THREE.MOUSE.ROTATE,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>
      <details className="head-layer-panel">
        <summary>Experimental head layers</summary>
        <p role="status">Alignment warning · brain–skull overlaps detected</p>
        <details><summary>Validation & limitations</summary><p>All 10 vessels reproduce the original source geometry. The three flagged mesh issues already exist in that source. Source-label checks do not establish complete anatomical courses. A further check detected brain surface points within the fitted skull's bone label, including sampled depths up to 3.91 mm in source CT space. This experimental cross-subject alignment has not passed anatomical validation. The Circle of Willis and other intracranial vessel networks are missing. For learning and research illustration; not for clinical decisions.</p><a href="/models/spl-head-neck/vessel-source-review.json" target="_blank" rel="noreferrer">Read source and alignment checks</a> · <a href="/models/spl-head-neck/brain-skull-collision-review.png" target="_blank" rel="noreferrer">View overlap evidence</a></details>
        {atlas !== 'spl' ? <p>Select the SPL/NAC atlas to preview these layers.</p> : <>
          <label><input type="checkbox" checked={head.enabled} onChange={() => toggle('enabled')} /> Show experimental head layers</label>
          {head.enabled && <>
            <label><input type="checkbox" checked={head.skull} onChange={() => toggle('skull')} /> Skull & mandible</label>
            <label><input type="checkbox" checked={head.arteries} onChange={() => toggle('arteries')} /> Neck arteries (SPL)</label>
            <label><input type="checkbox" checked={head.central} onChange={() => toggle('central')} /> Central arteries (BodyParts3D)</label>
            {head.central && <p>Shape-refined illustrative artery fit · held-out reference-surface median differences are 3.7–3.8 mm, with 95th percentiles of 8.8–9.3 mm. These are atlas surface checks, not vessel accuracy. Source bilateral elements include symmetric geometry. Skull and neck vessels use a different fit; connections between datasets are unvalidated. <a href="/models/bodyparts3d-central/coverage-and-alignment.json" target="_blank" rel="noreferrer">Coverage & alignment checks</a></p>}
            <label><input type="checkbox" checked={head.veins} onChange={() => toggle('veins')} /> Jugular veins</label>
            <label><input type="checkbox" checked={head.folds} onChange={() => toggle('folds')} /> Dural folds (falx & tentorium)</label>
            <label><input type="checkbox" checked={head.sinuses} onChange={() => toggle('sinuses')} /> Dural venous sinuses</label>
            {(head.folds || head.sinuses) && <p>Shape-refined Z-Anatomy illustrative fit · held-out reference-surface medians are about 3.8 mm, with 95th percentiles of 9.1–9.4 mm. These are atlas surface checks, not vascular accuracy. Dural folds do not form a complete outer dura covering. <a href="/models/z-anatomy-meninges/coverage-and-alignment.json" target="_blank" rel="noreferrer">Coverage & alignment</a> · <a href="/models/z-anatomy-meninges/NOTICE.md" target="_blank" rel="noreferrer">Attribution & ShareAlike licence</a></p>}
            {head.sinuses && <p role="status">Straight-sinus placement was reconstructed from source endpoints: the earlier 12–39 mm gaps are now about 0.25–1.1 mm by vertex proximity. This is not proof of lumen continuity or anatomical accuracy. Cavernous sinus source meshes still have disconnected parts.</p>}
            {head.folds && <p>The falx source mesh has topology irregularities. Geometry is preserved for inspection, not anatomically repaired.</p>}
            <label>Select head structure
              <select aria-label="Select head structure" value={headRegions.some(region => region.meshName === selectedRegion) ? selectedRegion ?? '' : ''} onChange={event => {
                useBrainStore.getState().setIsolatedRegion(null);
                useBrainStore.getState().setSelectedRegion(event.target.value || null);
              }}>
                <option value="">Choose a structure…</option>
                {headRegions.filter(region => isHeadRegionVisible(region, head)).map(region => <option key={region.meshName} value={region.meshName}>{region.name}</option>)}
              </select>
            </label>
            <p>Click a structure to select it. Hide the skull to pick the brain or vessels underneath.</p>
            <label>Skull opacity <input aria-label="Skull opacity" type="range" min="0.05" max="1" step="0.05" value={head.skullOpacity} onChange={event => setHead(current => ({ ...current, skullOpacity: Number(event.target.value) }))} /></label>
            <label>Vessel opacity <input aria-label="Vessel opacity" type="range" min="0.1" max="1" step="0.05" value={head.vesselOpacity} onChange={event => setHead(current => ({ ...current, vesselOpacity: Number(event.target.value) }))} /></label>
            {head.folds && <label>Dural fold opacity <input aria-label="Dural fold opacity" type="range" min="0.1" max="1" step="0.05" value={head.foldOpacity} onChange={event => setHead(current => ({ ...current, foldOpacity: Number(event.target.value) }))} /></label>}
            {explodeAmount > 0 && <p role="status">Return Explode to zero to inspect alignment.</p>}
          </>}
        </>}
        <p>Outer cranial dura, arachnoid and pia membranes remain unavailable. Fine vascular branches are incomplete.</p>
        <a href="#data-sources" onClick={() => useBrainStore.getState().setAppPage('data-sources')}>Sources & licence details</a>
      </details>
    </div>
  );
};

export default BrainScene;
