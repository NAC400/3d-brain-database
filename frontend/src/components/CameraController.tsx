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
  const { camera, controls, invalidate } = useThree();
  const cameraTarget = useBrainStore(state => state.cameraTarget);
  const setCameraTarget = useBrainStore(state => state.setCameraTarget);
  const animating   = useRef(false);
  const firstFrame = useRef(true);

  const destPos    = useRef(new THREE.Vector3());
  const destLookAt = useRef(new THREE.Vector3());

  // When store target changes, start animation
  React.useEffect(() => {
    if (!cameraTarget) { animating.current = false; return; }
    const [px, py, pz] = cameraTarget.position;
    const [lx, ly, lz] = cameraTarget.lookAt;
    destPos.current.set(px, py, pz);
    destLookAt.current.set(lx, ly, lz);
    animating.current = true;
    firstFrame.current = true;
    // Demand rendering may have been idle for seconds before this flight.
    invalidate();
    const ctrl = controls as any;
    const damping = ctrl?.enableDamping;
    if (ctrl) ctrl.enableDamping = false;
    return () => { if (ctrl) ctrl.enableDamping = damping; };
  }, [cameraTarget, camera, controls, invalidate]);

  useFrame(({ camera: cam, controls, invalidate }, delta) => {
    if (!animating.current || !cameraTarget) return;

    const elapsed = firstFrame.current ? 1 / 60 : delta;
    firstFrame.current = false;
    const alpha = 1 - Math.pow(1 - LERP_SPEED, elapsed * 60);
    cam.position.lerp(destPos.current, alpha);

    // Lerp OrbitControls target if accessible
    const ctrl = controls as any;
    if (ctrl?.target) {
      ctrl.target.lerp(destLookAt.current, alpha);
      ctrl.update?.();
    }

    invalidate();

    // Check arrival
    const posErr = cam.position.distanceTo(destPos.current);
    const targetErr = ctrl?.target ? ctrl.target.distanceTo(destLookAt.current) : 0;
    if (posErr < ARRIVE_THRESHOLD && targetErr < ARRIVE_THRESHOLD) {
      cam.position.copy(destPos.current);
      if (ctrl?.target) ctrl.target.copy(destLookAt.current);
      ctrl?.update?.();
      animating.current = false;
      setCameraTarget(null);
    }
  });

  return null;
};

export default CameraController;
