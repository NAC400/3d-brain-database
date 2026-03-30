/**
 * ClippingController — lives inside the R3F Canvas.
 *
 * Three.js coordinate system (Y-up, camera looking down -Z from [0,0,4.5]):
 *   X = Right  → Sagittal plane (divides Left / Right)
 *   Y = Up     → Axial plane   (divides Superior / Inferior)
 *   Z = toward camera → Coronal plane (divides Anterior / Posterior)
 *
 * Only planes whose per-axis enable flag is true are passed to the renderer.
 * Plane equation: normal·point + constant ≥ 0 = visible side.
 * So constant = -value means: show everything where axis ≥ value.
 */
import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBrainStore } from '../store/brainStore';

const sagittalPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
const axialPlane    = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const coronalPlane  = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const ClippingController: React.FC = () => {
  const { gl } = useThree();
  const { clippingPlanes, planeEnabled } = useBrainStore();

  useEffect(() => {
    const active: THREE.Plane[] = [];

    if (planeEnabled.sagittal) {
      sagittalPlane.constant = -clippingPlanes.sagittal;
      active.push(sagittalPlane);
    }
    if (planeEnabled.axial) {
      axialPlane.constant = -clippingPlanes.axial;
      active.push(axialPlane);
    }
    if (planeEnabled.coronal) {
      coronalPlane.constant = -clippingPlanes.coronal;
      active.push(coronalPlane);
    }

    gl.clippingPlanes = active;

    return () => { gl.clippingPlanes = []; };
  }, [
    gl,
    planeEnabled.sagittal, planeEnabled.axial, planeEnabled.coronal,
    clippingPlanes.sagittal, clippingPlanes.axial, clippingPlanes.coronal,
  ]);

  return null;
};

export default ClippingController;
