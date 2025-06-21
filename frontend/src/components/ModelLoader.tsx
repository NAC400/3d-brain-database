import React, { Suspense, useRef, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, Group } from 'three';
import { Html } from '@react-three/drei';

interface ModelLoaderProps {
  modelPath: string;
  fallbackComponent: React.ReactNode;
  scale?: [number, number, number];
  position?: [number, number, number];
  enableAnimation?: boolean;
}

const ModelLoader: React.FC<ModelLoaderProps> = ({
  modelPath,
  fallbackComponent,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  enableAnimation = true
}) => {
  return (
    <Suspense fallback={<ModelLoadingFallback />}>
      <LoadedModel
        modelPath={modelPath}
        fallbackComponent={fallbackComponent}
        scale={scale}
        position={position}
        enableAnimation={enableAnimation}
      />
    </Suspense>
  );
};

const LoadedModel: React.FC<ModelLoaderProps> = ({
  modelPath,
  fallbackComponent,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  enableAnimation = true
}) => {
  const groupRef = useRef<Group>(null);
  const [hasError, setHasError] = useState(false);

  // Try to load the model, fall back to placeholder if it fails
  let gltf;
  try {
    gltf = useLoader(GLTFLoader, modelPath);
  } catch (error) {
    console.warn(`Failed to load model at ${modelPath}, using fallback`);
    setHasError(true);
  }

  // Animation
  useFrame((state, delta) => {
    if (groupRef.current && enableAnimation && !hasError) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  // If model failed to load, show fallback
  if (hasError || !gltf) {
    return <>{fallbackComponent}</>;
  }

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={gltf.scene} />
    </group>
  );
};

const ModelLoadingFallback: React.FC = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4">
        <div className="brain-loader mb-3"></div>
        <span className="text-brain-secondary font-medium">
          Loading 3D Brain Model...
        </span>
        <span className="text-xs text-gray-400 mt-1">
          High-resolution model loading
        </span>
      </div>
    </Html>
  );
};

// Enhanced Brain Model with Real Model Support
export const EnhancedBrainModel: React.FC<{
  selectedRegion: string | null;
  showVasculature: boolean;
  showSkull: boolean;
  opacity: number;
  viewMode: string;
}> = ({ selectedRegion, showVasculature, showSkull, opacity, viewMode }) => {
  
  // Fallback component (your current geometric brain)
  const GeometricBrainFallback = () => (
    <group>
      {/* Main brain sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color={selectedRegion ? "#3b82f6" : "#94a3b8"}
          transparent
          opacity={opacity * 0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Skull layer */}
      {showSkull && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.3, 32, 32]} />
          <meshStandardMaterial
            color="#f8fafc"
            transparent
            opacity={opacity * 0.3}
            wireframe={true}
          />
        </mesh>
      )}
      
      {/* Vasculature */}
      {showVasculature && (
        <group>
          <mesh position={[0.5, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial
              color="#dc2626"
              transparent
              opacity={opacity * 0.8}
              emissive="#dc2626"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );

  return (
    <ModelLoader
      modelPath="/models/brain.gltf"
      fallbackComponent={<GeometricBrainFallback />}
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
      enableAnimation={viewMode === 'normal'}
    />
  );
};

export default ModelLoader; 