import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BRAIN_SCALE } from './BrainModel';
import { useBrainStore } from '../store/brainStore';
import metadata from '../data/experimentalHeadRegions.json';
import centralMetadata from '../data/centralArteryRegions.json';
import meningealMetadata from '../data/meningealRegions.json';

export const headRegions = [...metadata.regions, ...centralMetadata.regions, ...meningealMetadata.regions].map(region => ({ ...region, name: region.name.replace(/_/g, ' ').replace(/^\w/, letter => letter.toUpperCase()) }));

export interface HeadLayerOptions {
  enabled: boolean;
  skull: boolean;
  arteries: boolean;
  veins: boolean;
  central: boolean;
  folds: boolean;
  sinuses: boolean;
  skullOpacity: number;
  vesselOpacity: number;
  foldOpacity: number;
}

// The picker and scene inventory use the same category visibility rules.
export const isHeadRegionVisible = (region: { category: string }, options: HeadLayerOptions) =>
  region.category === 'Dural folds' ? options.folds : region.category === 'Dural venous sinuses' ? options.sinuses :
  region.category === 'Intracranial arteries' ? options.central : region.category === 'Skeleton' ? options.skull :
  region.category === 'Arteries' ? options.arteries : options.veins;

const ExperimentalHeadLayers: React.FC<{ options: HeadLayerOptions; origin: THREE.Vector3 }> = ({ options, origin }) => {
  const { scene } = useGLTF('/models/spl-head-neck/skull-vessels-experimental-fit.glb');
  const { scene: centralScene } = useGLTF('/models/bodyparts3d-central/central-arteries.glb');
  const { scene: meningealScene } = useGLTF('/models/z-anatomy-meninges/folds-and-sinuses.glb');
  const { selectedRegion, hoveredRegion, isolatedRegion, setSelectedRegion, setHoveredRegion, setIsolatedRegion, setHeadRegions, highlightColors, highlightMode, setHighlightColor } = useBrainStore();
  useEffect(() => {
    // Separate head inventory keeps brain counts intact; IDs remain dataset-specific.
    setHeadRegions(headRegions.filter(region => isHeadRegionVisible(region, options)));
  }, [setHeadRegions, options]);
  useEffect(() => () => { setHeadRegions([]); setHoveredRegion(null); document.body.style.cursor = ''; }, [setHeadRegions, setHoveredRegion]);
  const meshes = useMemo(() => {
    const result: { mesh: THREE.Mesh; system: 'skull' | 'arteries' | 'veins' | 'central' | 'folds' | 'sinuses'; material: THREE.MeshStandardMaterial }[] = [];
    for (const asset of [scene, centralScene, meningealScene]) asset.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const system = object.name.startsWith('ZA_') ? object.name.includes('_sinus') ? 'sinuses' : 'folds' : object.name.startsWith('BP3D_') ? 'central' : /jugular/.test(object.name) ? 'veins' : /carotid|vertebral/.test(object.name) ? 'arteries' : 'skull';
      result.push({ mesh: object, system, material: new THREE.MeshStandardMaterial({
        color: system === 'skull' ? '#e8ddc5' : system === 'folds' ? '#cdb485' : system === 'veins' || system === 'sinuses' ? '#60a5fa' : '#f87171',
        transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.8,
      }) });
    });
    return result;
  }, [scene, centralScene, meningealScene]);
  useEffect(() => () => meshes.forEach(({ material }) => material.dispose()), [meshes]);
  useEffect(() => {
    for (const { mesh, system, material } of meshes) {
      material.color.set(highlightColors[mesh.name] ?? (system === 'skull' ? '#e8ddc5' : system === 'folds' ? '#cdb485' : system === 'veins' || system === 'sinuses' ? '#60a5fa' : '#f87171'));
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
        <primitive object={material} attach="material" opacity={system === 'skull' ? options.skullOpacity : system === 'folds' ? options.foldOpacity : options.vesselOpacity} />
      </mesh>)}
  </group>;
};
export default ExperimentalHeadLayers;
