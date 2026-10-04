import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BRAIN_SCALE } from './BrainModel';
import { useBrainStore } from '../store/brainStore';
import metadata from '../data/experimentalHeadRegions.json';

export const headRegions = metadata.regions.map(region => ({ ...region, name: region.name.replace(/_/g, ' ').replace(/^\w/, letter => letter.toUpperCase()) }));

export interface HeadLayerOptions {
  enabled: boolean;
  skull: boolean;
  arteries: boolean;
  veins: boolean;
  skullOpacity: number;
  vesselOpacity: number;
}

const ExperimentalHeadLayers: React.FC<{ options: HeadLayerOptions; origin: THREE.Vector3 }> = ({ options, origin }) => {
  const { scene } = useGLTF('/models/spl-head-neck/skull-vessels-experimental-fit.glb');
  const { selectedRegion, hoveredRegion, isolatedRegion, setSelectedRegion, setHoveredRegion, setIsolatedRegion, setHeadRegions, highlightColors, highlightMode, setHighlightColor } = useBrainStore();
  useEffect(() => {
    // Separate head inventory keeps brain counts intact; IDs remain dataset-specific.
    setHeadRegions(headRegions.filter(region => region.category === 'Skeleton' ? options.skull : region.category === 'Arteries' ? options.arteries : options.veins));
  }, [setHeadRegions, options.skull, options.arteries, options.veins]);
  useEffect(() => () => { setHeadRegions([]); setHoveredRegion(null); document.body.style.cursor = ''; }, [setHeadRegions, setHoveredRegion]);
  const meshes = useMemo(() => {
    const result: { mesh: THREE.Mesh; system: 'skull' | 'arteries' | 'veins'; material: THREE.MeshStandardMaterial }[] = [];
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const system = /jugular/.test(object.name) ? 'veins' : /carotid|vertebral/.test(object.name) ? 'arteries' : 'skull';
      result.push({ mesh: object, system, material: new THREE.MeshStandardMaterial({
        color: system === 'skull' ? '#e8ddc5' : system === 'arteries' ? '#f87171' : '#60a5fa',
        transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.8,
      }) });
    });
    return result;
  }, [scene]);
  useEffect(() => () => meshes.forEach(({ material }) => material.dispose()), [meshes]);
  useEffect(() => {
    for (const { mesh, system, material } of meshes) {
      material.color.set(highlightColors[mesh.name] ?? (system === 'skull' ? '#e8ddc5' : system === 'arteries' ? '#f87171' : '#60a5fa'));
      material.emissive.set(mesh.name === selectedRegion ? '#685b14' : mesh.name === hoveredRegion ? '#302b10' : '#000000');
    }
  }, [meshes, selectedRegion, hoveredRegion, highlightColors]);
  // This is the actual brain group's offset, not the head's bounding-box centre.
  // The shared affine fit was baked upstream; do not apply it a second time.
  return <group position={origin} scale={BRAIN_SCALE}>
    {meshes.filter(({ system, mesh }) => options[system] && (!isolatedRegion || isolatedRegion === mesh.name)).map(({ mesh, material, system }) =>
      <mesh key={mesh.name} name={mesh.name} geometry={mesh.geometry} material={material} renderOrder={system === 'skull' ? 2 : 1}
        onClick={event => {
          event.stopPropagation();
          if (highlightMode) setHighlightColor(mesh.name, highlightColors[mesh.name] === '#f97316' ? '#22c55e' : '#f97316');
          else setSelectedRegion(selectedRegion === mesh.name ? null : mesh.name);
        }}
        onDoubleClick={event => { event.stopPropagation(); setSelectedRegion(mesh.name); setIsolatedRegion(isolatedRegion === mesh.name ? null : mesh.name); }}
        onPointerOver={event => { event.stopPropagation(); setHoveredRegion(mesh.name); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHoveredRegion(null); document.body.style.cursor = ''; }}>
        <primitive object={material} attach="material" opacity={system === 'skull' ? options.skullOpacity : options.vesselOpacity} />
      </mesh>)}
  </group>;
};
export default ExperimentalHeadLayers;
