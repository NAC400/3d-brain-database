import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { useBrainStore } from '../store/brainStore';
import BrainModel from './BrainModel';
import ClippingController from './ClippingController';
import CameraController from './CameraController';

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

// ---------------------------------------------------------------------------
// BrainScene
// ---------------------------------------------------------------------------
const BrainScene: React.FC = () => {
  const controlsRef = useRef<any>(null);

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
        style={{ display: 'block', width: '100%', height: '100%' }}
        camera={{
          position: [0, 0, 4.5],
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
          <BrainModel />
        </Suspense>

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
    </div>
  );
};

export default BrainScene;
