import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import { useBrainStore, PRESET_BRAIN_REGIONS } from '../store/brainStore';

interface BrainModelProps {
  selectedRegion: string | null;
  showVasculature: boolean;
  showSkull: boolean;
  opacity: number;
  viewMode: string;
}

const BrainModel: React.FC<BrainModelProps> = ({
  selectedRegion,
  showVasculature,
  showSkull,
  opacity,
  viewMode
}) => {
  const groupRef = useRef<Group>(null);
  const { loadBrainRegions } = useBrainStore();

  // Initialize brain regions data
  useEffect(() => {
    loadBrainRegions(PRESET_BRAIN_REGIONS);
  }, [loadBrainRegions]);

  // Animate the brain rotation
  useFrame((state, delta) => {
    if (groupRef.current && viewMode === 'normal') {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Brain Structure - Placeholder geometry until we have actual models */}
      <MainBrainStructure
        selectedRegion={selectedRegion}
        opacity={opacity}
        viewMode={viewMode}
      />
      
      {/* Skull Layer */}
      {showSkull && (
        <SkullLayer opacity={opacity * 0.3} />
      )}
      
      {/* Vasculature Layer */}
      {showVasculature && (
        <VasculatureLayer opacity={opacity * 0.8} />
      )}
      
      {/* Brain Regions with interactive highlighting */}
      <BrainRegions selectedRegion={selectedRegion} />
    </group>
  );
};

// Main brain structure component
const MainBrainStructure: React.FC<{
  selectedRegion: string | null;
  opacity: number;
  viewMode: string;
}> = ({ selectedRegion, opacity, viewMode }) => {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color={selectedRegion ? "#3b82f6" : "#94a3b8"}
        transparent
        opacity={opacity * 0.8}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

// Skull layer component
const SkullLayer: React.FC<{ opacity: number }> = ({ opacity }) => {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2.3, 32, 32]} />
      <meshStandardMaterial
        color="#f8fafc"
        transparent
        opacity={opacity}
        wireframe={true}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

// Vasculature layer component
const VasculatureLayer: React.FC<{ opacity: number }> = ({ opacity }) => {
  return (
    <group>
      {/* Simplified vasculature representation */}
      <mesh position={[0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={opacity}
          emissive="#dc2626"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={opacity}
          emissive="#dc2626"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.8, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={opacity}
          emissive="#dc2626"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

// Individual brain regions component
const BrainRegions: React.FC<{ selectedRegion: string | null }> = ({ selectedRegion }) => {
  const { brainRegions, setSelectedRegion } = useBrainStore();

  return (
    <group>
      {brainRegions.map((region) => (
        <BrainRegionMesh
          key={region.id}
          region={region}
          isSelected={selectedRegion === region.id}
          onSelect={() => setSelectedRegion(region.id)}
        />
      ))}
    </group>
  );
};

// Individual brain region mesh
const BrainRegionMesh: React.FC<{
  region: any;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ region, isSelected, onSelect }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Different geometries for different brain regions
  const getRegionGeometry = (regionId: string) => {
    switch (regionId) {
      case 'basal-ganglia':
        return <boxGeometry args={[0.3, 0.3, 0.3]} />;
      case 'hippocampus':
        return <cylinderGeometry args={[0.1, 0.15, 0.4, 8]} />;
      case 'amygdala':
        return <coneGeometry args={[0.12, 0.2, 8]} />;
      case 'thalamus':
        return <octahedronGeometry args={[0.15]} />;
      case 'cerebellum':
        return <sphereGeometry args={[0.4, 16, 16]} />;
      default:
        return <sphereGeometry args={[0.2, 16, 16]} />;
    }
  };

  const getRegionColor = (regionId: string, isSelected: boolean, hovered: boolean) => {
    if (isSelected) return "#10b981";
    if (hovered) return "#3b82f6";
    
    switch (regionId) {
      case 'basal-ganglia':
        return "#8b5cf6";
      case 'hippocampus':
        return "#ec4899";
      case 'amygdala':
        return "#f59e0b";
      case 'thalamus':
        return "#06b6d4";
      case 'cerebellum':
        return "#84cc16";
      default:
        return "#6b7280";
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={region.coordinates}
      onClick={onSelect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {getRegionGeometry(region.id)}
      <meshStandardMaterial
        color={getRegionColor(region.id, isSelected, hovered)}
        transparent
        opacity={isSelected ? 1 : 0.8}
        emissive={isSelected ? "#10b981" : "#000000"}
        emissiveIntensity={isSelected ? 0.3 : 0}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
};

export default BrainModel; 