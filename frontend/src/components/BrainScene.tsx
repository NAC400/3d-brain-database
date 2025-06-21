import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { useBrainStore } from '../store/brainStore';
import BrainModel from './BrainModel';
import BrainControls from './BrainControls';
import LoadingSpinner from './LoadingSpinner';

interface BrainSceneProps {
  className?: string;
}

const BrainScene: React.FC<BrainSceneProps> = ({ className = '' }) => {
  const {
    selectedRegion,
    showVasculature,
    showSkull,
    opacity,
    viewMode,
    isLoading
  } = useBrainStore();

  const controlsRef = useRef<any>(null);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        className="brain-canvas"
        camera={{
          position: [0, 0, 5],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting Setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          
          {/* Environment for realistic reflections */}
          <Environment preset="studio" />
          
          {/* Main Brain Model */}
          <BrainModel
            selectedRegion={selectedRegion}
            showVasculature={showVasculature}
            showSkull={showSkull}
            opacity={opacity}
            viewMode={viewMode}
          />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={20}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
        </Suspense>
      </Canvas>
      
      {/* Control Panel Overlay */}
      <BrainControls />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-dark-brain bg-opacity-80 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

// Loading fallback component for Suspense
const LoadingFallback: React.FC = () => {
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="brain-loader"></div>
        <span className="ml-3 text-brain-secondary">Loading Brain Model...</span>
      </div>
    </Html>
  );
};

export default BrainScene; 