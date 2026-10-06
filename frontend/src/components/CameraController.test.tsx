import React from 'react';
import { render, act } from '@testing-library/react';
import * as THREE from 'three';
import CameraController from './CameraController';
import { useBrainStore } from '../store/brainStore';

let mockFrame: (state: any, delta: number) => void;
const mockCamera = new THREE.PerspectiveCamera();
const mockControls = { target: new THREE.Vector3(), enableDamping: true, update: jest.fn() };
const mockInvalidate = jest.fn();
jest.mock('@react-three/fiber', () => ({
  useThree: () => ({ camera: mockCamera, controls: mockControls, invalidate: mockInvalidate }),
  useFrame: (callback: typeof mockFrame) => { mockFrame = callback; },
}));

beforeEach(() => {
  useBrainStore.setState({ cameraTarget: null });
  mockCamera.position.set(0, 0, 3);
  mockControls.target.set(0, 0, 0);
  mockControls.enableDamping = true;
  mockInvalidate.mockClear();
});

function step(delta: number) {
  act(() => mockFrame({ camera: mockCamera, controls: mockControls, invalidate: mockInvalidate }, delta));
}

test('starts demand rendering, ignores idle time, and restores damping on arrival', () => {
  render(<CameraController />);
  act(() => useBrainStore.getState().setCameraTarget({ position: [1, 0, 1], lookAt: [1, 0, 0] }));
  expect(mockInvalidate).toHaveBeenCalled();
  expect(mockControls.enableDamping).toBe(false);
  step(30);
  expect(mockCamera.position.x).toBeCloseTo(0.08);
  expect(mockControls.target.x).toBeCloseTo(0.08);
  for (let i = 0; i < 120; i++) step(1 / 60);
  expect(useBrainStore.getState().cameraTarget).toBeNull();
  expect(mockCamera.position.toArray()).toEqual([1, 0, 1]);
  expect(mockControls.target.toArray()).toEqual([1, 0, 0]);
  expect(mockControls.enableDamping).toBe(true);
});

test('travels the same distance at 20 and 60 FPS for equal elapsed time', () => {
  const view = render(<CameraController />);
  const target = { position: [1, 0, 1] as [number, number, number], lookAt: [1, 0, 0] as [number, number, number] };
  act(() => useBrainStore.getState().setCameraTarget(target));
  step(1 / 60);
  const start = mockCamera.position.clone();
  const lookStart = mockControls.target.clone();
  for (let i = 0; i < 12; i++) step(1 / 60);
  const fast = mockCamera.position.clone();
  mockCamera.position.copy(start);
  mockControls.target.copy(lookStart);
  for (let i = 0; i < 4; i++) step(1 / 20);
  expect(mockCamera.position.distanceTo(fast)).toBeLessThan(1e-10);
  view.unmount();
  expect(mockControls.enableDamping).toBe(true);
});
