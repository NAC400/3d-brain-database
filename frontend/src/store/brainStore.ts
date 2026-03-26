// TODO: brainStore — state management for the real GLB model pipeline.
//
// Regions are loaded dynamically by traversing the .glb mesh hierarchy, not
// from a hardcoded preset list. Each BrainRegion maps to a named mesh in the
// model file and carries hierarchy data (parent/children) for the dissection
// system. Clipping planes drive the cross-section views; explodeAmount drives
// the exploded-view animation. The source panel state lives here so toolbar
// and sidebar stay in sync without prop drilling.
//
// Next steps:
//  1. Call loadBrainRegions() inside the GLTFLoader traversal in ModelViewer/.
//  2. Wire explodeAmount to mesh position offsets (centroid-based explosion).
//  3. Implement clipping plane uniforms in BrainScene canvas.
//  4. Connect sourcePanel open/close to the Sidebar component.

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrainRegion {
  id: string;
  name: string;
  anatomicalId: string;
  meshName: string;           // exact name of the mesh inside the .glb file
  depthLayer: number;         // 0 = outermost (cortex), higher = deeper structures
  parentId: string | null;    // parent region id for hierarchy / dissection tree
  children: string[];         // child region ids
  description: string;
  color?: string;             // optional override colour; defaults come from Blender material
}

export interface ClippingPlanes {
  sagittal: number;   // X-axis position (-1 … 1, 0 = mid-plane)
  coronal: number;    // Y-axis position
  axial: number;      // Z-axis position
}

export interface SourcePanelState {
  isOpen: boolean;
  selectedSourceId: string | null;
}

export interface BrainState {
  // --- Visual ---
  selectedRegion: string | null;
  hoveredRegion: string | null;
  opacity: number;
  viewMode: 'normal' | 'cross-section' | 'layers' | 'annotations';
  isLoading: boolean;

  // --- Dissection / explode ---
  explodeAmount: number;          // 0 = assembled, 1 = fully exploded
  isolatedRegion: string | null;  // if set, only this region is visible

  // --- Clipping planes ---
  clippingPlanes: ClippingPlanes;
  clippingEnabled: boolean;

  // --- Region data (loaded from traversal of the .glb file) ---
  brainRegions: BrainRegion[];

  // --- Source / research panel ---
  sourcePanel: SourcePanelState;

  // --- Annotations ---
  annotations: any[];

  // --- Actions ---
  setSelectedRegion: (regionId: string | null) => void;
  setHoveredRegion: (regionId: string | null) => void;
  setOpacity: (opacity: number) => void;
  setViewMode: (mode: BrainState['viewMode']) => void;
  setLoading: (loading: boolean) => void;

  setExplodeAmount: (amount: number) => void;
  setIsolatedRegion: (regionId: string | null) => void;

  setClippingPlane: (axis: keyof ClippingPlanes, value: number) => void;
  setClippingEnabled: (enabled: boolean) => void;

  loadBrainRegions: (regions: BrainRegion[]) => void;

  setSourcePanelOpen: (isOpen: boolean) => void;
  setSelectedSource: (sourceId: string | null) => void;

  addAnnotation: (annotation: any) => void;
  removeAnnotation: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBrainStore = create<BrainState>((set) => ({
  // Visual
  selectedRegion: null,
  hoveredRegion: null,
  opacity: 1.0,
  viewMode: 'normal',
  isLoading: false,

  // Dissection
  explodeAmount: 0,
  isolatedRegion: null,

  // Clipping
  clippingPlanes: { sagittal: 0, coronal: 0, axial: 0 },
  clippingEnabled: false,

  // Data
  brainRegions: [],

  // Source panel
  sourcePanel: { isOpen: false, selectedSourceId: null },

  // Annotations
  annotations: [],

  // --- Actions ---
  setSelectedRegion: (regionId) => set({ selectedRegion: regionId }),
  setHoveredRegion: (regionId) => set({ hoveredRegion: regionId }),
  setOpacity: (opacity) => set({ opacity: Math.max(0, Math.min(1, opacity)) }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),

  setExplodeAmount: (amount) =>
    set({ explodeAmount: Math.max(0, Math.min(1, amount)) }),
  setIsolatedRegion: (regionId) => set({ isolatedRegion: regionId }),

  setClippingPlane: (axis, value) =>
    set((state) => ({
      clippingPlanes: { ...state.clippingPlanes, [axis]: value },
    })),
  setClippingEnabled: (enabled) => set({ clippingEnabled: enabled }),

  loadBrainRegions: (regions) => set({ brainRegions: regions }),

  setSourcePanelOpen: (isOpen) =>
    set((state) => ({ sourcePanel: { ...state.sourcePanel, isOpen } })),
  setSelectedSource: (sourceId) =>
    set((state) => ({
      sourcePanel: { ...state.sourcePanel, selectedSourceId: sourceId },
    })),

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [
        ...state.annotations,
        { ...annotation, id: Date.now().toString() },
      ],
    })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    })),
}));
