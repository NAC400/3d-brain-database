import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { BRAIN_SCALE } from './BrainModel';

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
  // This is the actual brain group's offset, not the head's bounding-box centre.
  // The shared affine fit was baked upstream; do not apply it a second time.
  return <group position={origin} scale={BRAIN_SCALE}>
    {meshes.filter(({ system }) => options[system]).map(({ mesh, material, system }) =>
      <mesh key={mesh.name} name={mesh.name} geometry={mesh.geometry} material={material} renderOrder={system === 'skull' ? 2 : 1}
        raycast={() => { /* Preview context; selection follows separately. */ }}>
        <primitive object={material} attach="material" opacity={system === 'skull' ? options.skullOpacity : options.vesselOpacity} />
      </mesh>)}
  </group>;
};
export default ExperimentalHeadLayers;
