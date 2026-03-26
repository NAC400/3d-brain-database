import React, { useEffect, useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBrainStore, BrainRegion } from '../store/brainStore';

const MODEL_URL = '/models/brain.glb';

// The brain.glb has vertices in MNI millimeter space (~200mm wide).
// Scale 0.01 converts mm → ~2 scene units, fitting the default camera.
const BRAIN_SCALE = 0.01;

// At scale 0.01, explode offset of 2 mm == 0.02 scene units — too small.
// Use 200 mm so visual explode distance is 200*0.01 = 2 scene units.
const EXPLODE_SCALE = 200;

useGLTF.preload(MODEL_URL);

// ---------------------------------------------------------------------------
// Per-mesh instance — handles highlight, explode, isolate, hover/click
// ---------------------------------------------------------------------------

interface RegionMeshProps {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;   // mesh.position in local group space (all zeros from GLB)
  centroidDir: THREE.Vector3;    // direction from brain centroid to this mesh centroid (mm)
}

const RegionMesh: React.FC<RegionMeshProps> = ({ mesh, basePosition, centroidDir }) => {
  const ref = useRef<THREE.Mesh>(null!);

  const {
    selectedRegion,
    hoveredRegion,
    explodeAmount,
    isolatedRegion,
    setSelectedRegion,
    setHoveredRegion,
  } = useBrainStore();

  const meshName   = mesh.name;
  const isSelected = selectedRegion === meshName;
  const isHovered  = hoveredRegion  === meshName;
  const isIsolated = isolatedRegion !== null;
  const isVisible  = isolatedRegion === null || isolatedRegion === meshName;

  // Clone material once per mesh so mutations don't bleed between meshes
  const material = useMemo(() => {
    const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const mat = (src as THREE.MeshStandardMaterial).clone();
    mat.transparent = true;
    mat.side = THREE.DoubleSide; // IJK→RAS transform can flip winding; DoubleSide avoids invisible faces
    return mat;
  }, [mesh]);

  useFrame(() => {
    if (!ref.current) return;

    // Explode: shift each mesh outward from the brain centroid.
    // centroidDir is in mm, position is in mm (pre-scale group space).
    ref.current.position
      .copy(basePosition)
      .addScaledVector(centroidDir, explodeAmount * EXPLODE_SCALE);

    // Visibility
    if (!isVisible) {
      material.opacity = 0;
      material.depthWrite = false;
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    // Opacity: dim non-selected regions when a selection is active
    const targetOpacity = isSelected
      ? 1.0
      : isHovered
        ? 0.95
        : isIsolated
          ? 1.0
          : selectedRegion !== null
            ? 0.2
            : 1.0;

    material.opacity    = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.12);
    material.depthWrite = material.opacity > 0.5;

    // Emissive highlight on hover / select
    const targetEmissive = isSelected
      ? new THREE.Color(0.35, 0.35, 0.1)
      : isHovered
        ? new THREE.Color(0.15, 0.15, 0.05)
        : new THREE.Color(0, 0, 0);
    material.emissive.lerp(targetEmissive, 0.15);
  });

  return (
    <mesh
      ref={ref}
      geometry={mesh.geometry}
      material={material}
      name={meshName}
      position={basePosition}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedRegion(isSelected ? null : meshName);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredRegion(meshName);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHoveredRegion(null);
        document.body.style.cursor = 'auto';
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// BrainModel — loads the GLB, sets scale, traverses meshes, registers regions
// ---------------------------------------------------------------------------

const BrainModel: React.FC = () => {
  const { scene } = useGLTF(MODEL_URL);
  const { loadBrainRegions, setLoading } = useBrainStore();

  const meshes = useMemo(() => {
    const result: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) result.push(obj as THREE.Mesh);
    });
    return result;
  }, [scene]);

  // Compute:
  //  - groupOffset: shifts the group so the brain's geometric center sits at world [0,0,0]
  //  - centroidDirs: per-mesh outward direction from brain center (used for explode)
  const { groupOffset, basePositions, centroidDirs } = useMemo(() => {
    const bases: Record<string, THREE.Vector3> = {};
    const dirs: Record<string, THREE.Vector3>  = {};

    // Overall bounding box of all geometry (in mm, pre-scale)
    const globalBox = new THREE.Box3();
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      globalBox.union(mesh.geometry.boundingBox!);
    }
    const brainCenterMm = new THREE.Vector3();
    globalBox.getCenter(brainCenterMm);

    // Group position in scene units that places the brain center at world [0,0,0]:
    //   world = groupPosition + BRAIN_SCALE * vertex_mm
    //   0     = groupPosition + BRAIN_SCALE * brainCenterMm
    //   groupPosition = -BRAIN_SCALE * brainCenterMm
    const groupOffset = brainCenterMm.clone().multiplyScalar(-BRAIN_SCALE);

    for (const mesh of meshes) {
      const c = new THREE.Vector3();
      mesh.geometry.boundingBox!.getCenter(c);

      bases[mesh.name] = mesh.position.clone(); // [0,0,0] for all GLB meshes

      // Explode direction: outward from the brain's center
      const dir = c.clone().sub(brainCenterMm);
      if (dir.length() < 0.001) dir.set(0, 1, 0);
      dirs[mesh.name] = dir.normalize();
    }

    return { groupOffset, basePositions: bases, centroidDirs: dirs };
  }, [meshes]);

  // Register regions in the store once meshes are available
  useEffect(() => {
    setLoading(true);
    const regions: BrainRegion[] = meshes.map((mesh) => ({
      id:           mesh.name,
      name:         mesh.name,
      anatomicalId: mesh.name,
      meshName:     mesh.name,
      depthLayer:   0,
      parentId:     null,
      children:     [],
      description:  '',
    }));
    loadBrainRegions(regions);
    setLoading(false);
  }, [meshes, loadBrainRegions, setLoading]);

  return (
    // scale: converts MNI mm → ~2 scene units
    // position (groupOffset): centers the brain at world [0,0,0] so OrbitControls
    //   always orbits around the brain's actual geometric center
    <group
      scale={BRAIN_SCALE}
      position={groupOffset}
      onClick={(e) => {
        if (e.object === e.eventObject) {
          useBrainStore.getState().setSelectedRegion(null);
        }
      }}
    >
      {meshes.map((mesh) => (
        <RegionMesh
          key={mesh.name}
          mesh={mesh}
          basePosition={basePositions[mesh.name] ?? new THREE.Vector3()}
          centroidDir={centroidDirs[mesh.name]  ?? new THREE.Vector3(0, 1, 0)}
        />
      ))}
    </group>
  );
};

export default BrainModel;
