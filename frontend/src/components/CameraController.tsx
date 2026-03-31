/**
 * CameraController — lives inside the R3F Canvas.
 *
 * Reads `cameraTarget` from the store and smoothly lerps the camera position
 * and OrbitControls target toward it. After reaching the target it clears the
 * store value so future zoom-outs don't snap back.
 */
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBrainStore } from '../store/brainStore';

const LERP_SPEED = 0.08;
const ARRIVE_THRESHOLD = 0.002;

const CameraController: React.FC = () => {
  const { camera } = useThree();
  const { cameraTarget, setCameraTarget } = useBrainStore();
  const controlsTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Keep a local copy of the controls target so we can lerp it
  const localTarget = useRef(new THREE.Vector3());
  const localPos    = useRef(new THREE.Vector3());
  const animating   = useRef(false);

  const destPos    = useRef(new THREE.Vector3());
  const destLookAt = useRef(new THREE.Vector3());

  // When store target changes, start animation
  React.useEffect(() => {
    if (!cameraTarget) return;
    localPos.current.copy(camera.position);
    const [px, py, pz] = cameraTarget.position;
    const [lx, ly, lz] = cameraTarget.lookAt;
    destPos.current.set(px, py, pz);
    destLookAt.current.set(lx, ly, lz);
    animating.current = true;
  }, [cameraTarget, camera]);

  useFrame(({ camera: cam, controls, invalidate }) => {
    if (!animating.current || !cameraTarget) return;

    cam.position.lerp(destPos.current, LERP_SPEED);

    // Lerp OrbitControls target if accessible
    const ctrl = controls as any;
    if (ctrl?.target) {
      ctrl.target.lerp(destLookAt.current, LERP_SPEED);
      ctrl.update?.();
    }

    invalidate();

    // Check arrival
    const posErr = cam.position.distanceTo(destPos.current);
    if (posErr < ARRIVE_THRESHOLD) {
      cam.position.copy(destPos.current);
      if (ctrl?.target) ctrl.target.copy(destLookAt.current);
      animating.current = false;
      setCameraTarget(null);
    }
  });

  return null;
};

export default CameraController;
