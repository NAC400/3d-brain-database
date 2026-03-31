import React, { useEffect, useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBrainStore } from '../store/brainStore';
import type { BrainRegion, BrainBounds } from '../store/brainStore';

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
  const { invalidate } = useThree();

  const {
    selectedRegion,
    hoveredRegion,
    explodeAmount,
    isolatedRegion,
    hiddenCategories,
    regionMap,
    setSelectedRegion,
    setHoveredRegion,
  } = useBrainStore();

  const meshName   = mesh.name;
  const isSelected = selectedRegion === meshName;
  const isHovered  = hoveredRegion  === meshName;
  const isIsolated = isolatedRegion !== null;
  const regionData = regionMap[meshName];
  const isCategoryHidden = regionData ? hiddenCategories.has(regionData.category) : false;
  const isVisible  = !isCategoryHidden && (isolatedRegion === null || isolatedRegion === meshName);

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
    const prevPos = ref.current.position.clone();
    ref.current.position
      .copy(basePosition)
      .addScaledVector(centroidDir, explodeAmount * EXPLODE_SCALE);
    if (ref.current.position.distanceTo(prevPos) > 0.0001) invalidate();

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

    const prevOpacity = material.opacity;
    material.opacity    = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.12);
    material.depthWrite = material.opacity > 0.5;

    // Emissive highlight on hover / select
    const targetEmissive = isSelected
      ? new THREE.Color(0.35, 0.35, 0.1)
      : isHovered
        ? new THREE.Color(0.15, 0.15, 0.05)
        : new THREE.Color(0, 0, 0);
    const prevR = material.emissive.r;
    const prevG = material.emissive.g;
    const prevB = material.emissive.b;
    material.emissive.lerp(targetEmissive, 0.15);

    // Keep rendering while lerp animations are still running
    const opacityDelta  = Math.abs(material.opacity - prevOpacity);
    const emissiveDelta = Math.abs(material.emissive.r - prevR)
                        + Math.abs(material.emissive.g - prevG)
                        + Math.abs(material.emissive.b - prevB);
    if (opacityDelta > 0.001 || emissiveDelta > 0.001) invalidate();
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
// MirroredHemisphere — renders the same meshes reflected across X (no interaction)
// Used to fill in the missing hemisphere when only one side is in the GLB.
// ---------------------------------------------------------------------------

interface MirroredProps {
  meshes:        THREE.Mesh[];
  groupOffset:   THREE.Vector3;
  basePositions: Record<string, THREE.Vector3>;
  centroidDirs:  Record<string, THREE.Vector3>;
}

const MirroredHemisphere: React.FC<MirroredProps> = ({ meshes, groupOffset, basePositions, centroidDirs }) => {
  const { explodeAmount } = useBrainStore();
  const { invalidate } = useThree();

  // Mirror position: reflect groupOffset.x so the brain reflects across world X=0
  const mirrorOffset = new THREE.Vector3(-groupOffset.x, groupOffset.y, groupOffset.z);

  const materials = useMemo(() =>
    meshes.map((mesh) => {
      const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const mat = (src as THREE.MeshStandardMaterial).clone();
      mat.transparent = true;
      mat.opacity = 0.75;
      mat.side = THREE.DoubleSide;
      return mat;
    }),
  [meshes]);

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    let needsUpdate = false;
    meshes.forEach((mesh, i) => {
      const ref = refs.current[i];
      if (!ref) return;
      const base = basePositions[mesh.name] ?? new THREE.Vector3();
      const dir  = centroidDirs[mesh.name]  ?? new THREE.Vector3(0, 1, 0);
      // Mirror the X component of the explode direction so it fans out symmetrically
      const mirroredDir = new THREE.Vector3(-dir.x, dir.y, dir.z);
      const prev = ref.position.clone();
      ref.position.copy(base).addScaledVector(mirroredDir, explodeAmount * EXPLODE_SCALE);
      if (ref.position.distanceTo(prev) > 0.0001) needsUpdate = true;
    });
    if (needsUpdate) invalidate();
  });

  return (
    // scale.x is negative to mirror the hemisphere across the X axis
    <group scale={[-BRAIN_SCALE, BRAIN_SCALE, BRAIN_SCALE]} position={mirrorOffset}>
      {meshes.map((mesh, i) => (
        <mesh
          key={mesh.name + '_mirror'}
          ref={(el) => { refs.current[i] = el; }}
          geometry={mesh.geometry}
          material={materials[i]}
          position={basePositions[mesh.name] ?? new THREE.Vector3()}
        />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// BrainModel — loads the GLB, sets scale, traverses meshes, registers regions
// ---------------------------------------------------------------------------

const BrainModel: React.FC = () => {
  const { scene } = useGLTF(MODEL_URL);
  const { loadBrainRegions, setLoading, setBrainBounds, setRegionCentroids, showMirroredHemisphere } = useBrainStore();

  const meshes = useMemo(() => {
    const result: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) result.push(obj as THREE.Mesh);
    });
    return result;
  }, [scene]);

  // Compute:
  //  - filteredMeshes: meshes whose centroid is within OUTLIER_THRESHOLD_MM of the brain center
  //  - groupOffset: shifts the group so the brain's geometric center sits at world [0,0,0]
  //  - centroidDirs: per-mesh outward direction from brain center (used for explode)

  // Any mesh whose centroid is farther than this from the brain center is an artifact
  // (stray voxels, disconnected lobes, etc.). The brain itself spans ~100mm radius.
  const OUTLIER_THRESHOLD_MM = 130;

  const { filteredMeshes, groupOffset, basePositions, centroidDirs, bounds } = useMemo(() => {
    const bases: Record<string, THREE.Vector3> = {};
    const dirs: Record<string, THREE.Vector3>  = {};

    // Pass 1 — compute bounding box of ALL meshes to find the approximate brain center
    const globalBox = new THREE.Box3();
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      globalBox.union(mesh.geometry.boundingBox!);
    }
    const brainCenterMm = new THREE.Vector3();
    globalBox.getCenter(brainCenterMm);

    // Pass 2 — filter out outlier meshes whose centroid is too far from the brain center
    const centroids: Record<string, THREE.Vector3> = {};
    for (const mesh of meshes) {
      const c = new THREE.Vector3();
      mesh.geometry.boundingBox!.getCenter(c);
      centroids[mesh.name] = c;
    }
    const kept = meshes.filter(
      (m) => centroids[m.name].distanceTo(brainCenterMm) <= OUTLIER_THRESHOLD_MM
    );

    // Pass 3 — recompute brain center using only in-bounds meshes, then build offset/dirs
    const keptBox = new THREE.Box3();
    for (const mesh of kept) {
      keptBox.union(mesh.geometry.boundingBox!);
    }
    const keptCenterMm = new THREE.Vector3();
    keptBox.getCenter(keptCenterMm);

    // Group position in scene units that places the brain center at world [0,0,0]:
    //   world = groupPosition + BRAIN_SCALE * vertex_mm
    //   0     = groupPosition + BRAIN_SCALE * keptCenterMm
    //   groupPosition = -BRAIN_SCALE * keptCenterMm
    const groupOffset = keptCenterMm.clone().multiplyScalar(-BRAIN_SCALE);

    for (const mesh of kept) {
      bases[mesh.name] = mesh.position.clone(); // [0,0,0] for all GLB meshes

      // Explode direction: outward from the brain's center
      const dir = centroids[mesh.name].clone().sub(keptCenterMm);
      if (dir.length() < 0.001) dir.set(0, 1, 0);
      dirs[mesh.name] = dir.normalize();
    }

    // World-space bounds: (vertex_mm - keptCenterMm) * BRAIN_SCALE
    const bounds: BrainBounds = {
      xMin: (keptBox.min.x - keptCenterMm.x) * BRAIN_SCALE,
      xMax: (keptBox.max.x - keptCenterMm.x) * BRAIN_SCALE,
      yMin: (keptBox.min.y - keptCenterMm.y) * BRAIN_SCALE,
      yMax: (keptBox.max.y - keptCenterMm.y) * BRAIN_SCALE,
      zMin: (keptBox.min.z - keptCenterMm.z) * BRAIN_SCALE,
      zMax: (keptBox.max.z - keptCenterMm.z) * BRAIN_SCALE,
    };

    return { filteredMeshes: kept, groupOffset, basePositions: bases, centroidDirs: dirs, bounds };
  }, [meshes]);

  // Push computed world-space bounds into the store (used by slider min/max)
  useEffect(() => { setBrainBounds(bounds); }, [bounds, setBrainBounds]);

  // Push per-mesh world-space centroids (used by camera zoom-to-region)
  useEffect(() => {
    const centroids: Record<string, [number,number,number]> = {};
    for (const mesh of filteredMeshes) {
      const c = new THREE.Vector3();
      mesh.geometry.boundingBox!.getCenter(c);
      // world = (c - keptCenterMm) * BRAIN_SCALE  ≡  c * BRAIN_SCALE + groupOffset
      const wx = c.x * BRAIN_SCALE + groupOffset.x;
      const wy = c.y * BRAIN_SCALE + groupOffset.y;
      const wz = c.z * BRAIN_SCALE + groupOffset.z;
      centroids[mesh.name] = [wx, wy, wz];
    }
    setRegionCentroids(centroids);
  }, [filteredMeshes, groupOffset, setRegionCentroids]);

  // Load enriched region data from regions.json, then register with the store
  useEffect(() => {
    setLoading(true);
    fetch('/data/regions.json')
      .then((r) => r.json())
      .then((json) => {
        loadBrainRegions(json.regions as BrainRegion[]);
      })
      .catch(() => {
        // Fallback: register mesh names only (no rich data)
        const fallback: BrainRegion[] = filteredMeshes.map((m) => ({
          meshName:   m.name,
          labelId:    0,
          name:       m.name,
          acronym:    m.name,
          color:      '#94a3b8',
          depth:      0,
          parentId:   null,
          parentName: null,
          category:   'Subcortical',
        }));
        loadBrainRegions(fallback);
      })
      .finally(() => setLoading(false));
  }, [filteredMeshes, loadBrainRegions, setLoading]);

  return (
    <>
      {/* Mirrored hemisphere (visual only, no interactivity) */}
      {showMirroredHemisphere && (
        <MirroredHemisphere
          meshes={filteredMeshes}
          groupOffset={groupOffset}
          basePositions={basePositions}
          centroidDirs={centroidDirs}
        />
      )}

      {/* Original hemisphere (interactive) */}
      <group
        scale={BRAIN_SCALE}
        position={groupOffset}
        onClick={(e) => {
          if (e.object === e.eventObject) {
            useBrainStore.getState().setSelectedRegion(null);
          }
        }}
      >
        {filteredMeshes.map((mesh) => (
          <RegionMesh
            key={mesh.name}
            mesh={mesh}
            basePosition={basePositions[mesh.name] ?? new THREE.Vector3()}
            centroidDir={centroidDirs[mesh.name]  ?? new THREE.Vector3(0, 1, 0)}
          />
        ))}
      </group>
    </>
  );
};

export default BrainModel;
