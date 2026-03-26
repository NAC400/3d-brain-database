import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useBrainStore } from '../store/brainStore';
import BrainModel from './BrainModel';
import LoadingSpinner from './LoadingSpinner';

const BrainScene: React.FC = () => {
  const { isLoading } = useBrainStore();
  const controlsRef = useRef<any>(null);

  return (
    /*
     * Inline styles only — no Tailwind. The parent (App.tsx grid middle row) has
     * position:relative, so inset:0 here stretches this div to fill it completely.
     * Using inline styles avoids Tailwind class-generation issues that caused the
     * "thin strip" bug in earlier versions.
     */
    <div
      style={{
        position: 'absolute',
        inset: 0,               // top:0 right:0 bottom:0 left:0
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{ display: 'block', width: '100%', height: '100%' }}
        camera={{
          // Direct lateral view — camera is at eye level with the brain center,
          // looking straight at it. No vertical offset = brain appears centered.
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
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]}  intensity={1.2} />
        <directionalLight position={[-5, -3, -5]} intensity={0.4} />
        <pointLight       position={[0, 10, 0]}  intensity={0.6} />

        <Suspense fallback={<LoadingFallback />}>
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

      {/* React-side loading overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(15,23,42,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

const LoadingFallback: React.FC = () => (
  <Html center>
    <div style={{ color: '#3b82f6', fontFamily: 'sans-serif', fontSize: 14, whiteSpace: 'nowrap' }}>
      Loading brain model…
    </div>
  </Html>
);

export default BrainScene;
