import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrainRegion {
  meshName:   string;   // exact name of the mesh inside the .glb file
  labelId:    number;
  name:       string;
  acronym:    string;
  color:      string;   // hex from Allen ontology
  depth:      number;
  parentId:   number | null;
  parentName: string | null;
  category:   string;   // Cortex | Basal Ganglia | Limbic | Diencephalon | Brainstem | Cerebellum | White Matter & Ventricles | Subcortical
}

export interface ClippingPlanes {
  // World-space cut positions (brain spans ~±1 after BRAIN_SCALE=0.01).
  // Defaults are -2 so that enabling a plane doesn't immediately cut the brain.
  sagittal: number;   // X-axis: normal [1,0,0] → divides Left / Right
  axial:    number;   // Y-axis: normal [0,1,0] → divides Superior / Inferior
  coronal:  number;   // Z-axis: normal [0,0,1] → divides Anterior / Posterior
}

export interface PlaneEnabled {
  sagittal: boolean;
  axial:    boolean;
  coronal:  boolean;
}

export interface SourcePanelState {
  isOpen:          boolean;
  selectedSourceId: string | null;
}

export const ALL_CATEGORIES = [
  'Cortex',
  'Basal Ganglia',
  'Limbic',
  'Diencephalon',
  'Brainstem',
  'Cerebellum',
  'White Matter & Ventricles',
  'Subcortical',
] as const;

export type Category = typeof ALL_CATEGORIES[number];

// World-space axis-aligned bounds of the brain after centering (computed from GLB geometry).
// Used to set dynamic slider min/max for clipping planes.
export interface BrainBounds {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  zMin: number; zMax: number;
}

export interface BrainState {
  // --- Visual ---
  selectedRegion: string | null;
  hoveredRegion:  string | null;
  viewMode:       'normal' | 'cross-section' | 'layers' | 'annotations';
  isLoading:      boolean;

  // --- Dissection / explode ---
  explodeAmount:  number;          // 0 = assembled, 1 = fully exploded
  isolatedRegion: string | null;

  // --- Layer visibility ---
  hiddenCategories: Set<string>;

  // --- Clipping planes ---
  clippingPlanes:  ClippingPlanes;
  planeEnabled:    PlaneEnabled;   // per-axis enable; clippingEnabled = any plane active
  clippingEnabled: boolean;        // true when at least one plane is active (derived, kept for compat)

  // --- Full-brain mirror ---
  showMirroredHemisphere: boolean;   // renders the GLB mirrored across X to form a full brain

  // --- World-space bounds (set once GLB loads) ---
  brainBounds: BrainBounds | null;

  // --- Region data ---
  brainRegions: BrainRegion[];
  regionMap:    Record<string, BrainRegion>;  // meshName → BrainRegion

  // --- Source / research panel ---
  sourcePanel: SourcePanelState;

  // --- Annotations ---
  annotations: any[];

  // --- Actions ---
  setSelectedRegion:  (regionId: string | null) => void;
  setHoveredRegion:   (regionId: string | null) => void;
  setViewMode:        (mode: BrainState['viewMode']) => void;
  setLoading:         (loading: boolean) => void;

  setExplodeAmount:   (amount: number) => void;
  setIsolatedRegion:  (regionId: string | null) => void;

  toggleCategory:     (category: string) => void;
  setCategoryVisible: (category: string, visible: boolean) => void;

  setClippingPlane:   (axis: keyof ClippingPlanes, value: number) => void;
  setPlaneEnabled:    (axis: keyof PlaneEnabled, enabled: boolean) => void;
  setClippingEnabled: (enabled: boolean) => void;
  resetClipping:      () => void;

  setShowMirroredHemisphere: (show: boolean) => void;
  setBrainBounds:            (bounds: BrainBounds) => void;

  loadBrainRegions:   (regions: BrainRegion[]) => void;

  setSourcePanelOpen: (isOpen: boolean) => void;
  setSelectedSource:  (sourceId: string | null) => void;

  addAnnotation:    (annotation: any) => void;
  removeAnnotation: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBrainStore = create<BrainState>((set) => ({
  // Visual
  selectedRegion: null,
  hoveredRegion:  null,
  viewMode:       'normal',
  isLoading:      false,

  // Dissection
  explodeAmount:  0,
  isolatedRegion: null,

  // Layer visibility (all visible by default)
  hiddenCategories: new Set<string>(),

  // Clipping — default values are -2 (outside brain bounds) so enabling a plane
  // doesn't immediately cut the brain; user slides right to start cutting.
  clippingPlanes:  { sagittal: -2, axial: -2, coronal: -2 },
  planeEnabled:    { sagittal: false, axial: false, coronal: false },
  clippingEnabled: false,

  // Mirror
  showMirroredHemisphere: false,
  brainBounds: null,

  // Data
  brainRegions: [],
  regionMap:    {},

  // Source panel
  sourcePanel: { isOpen: false, selectedSourceId: null },

  // Annotations
  annotations: [],

  // --- Actions ---
  setSelectedRegion: (regionId) => set({ selectedRegion: regionId }),
  setHoveredRegion:  (regionId) => set({ hoveredRegion: regionId }),
  setViewMode:       (mode)     => set({ viewMode: mode }),
  setLoading:        (loading)  => set({ isLoading: loading }),

  setExplodeAmount:  (amount) =>
    set({ explodeAmount: Math.max(0, Math.min(1, amount)) }),
  setIsolatedRegion: (regionId) => set({ isolatedRegion: regionId }),

  toggleCategory: (category) =>
    set((state) => {
      const next = new Set(state.hiddenCategories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { hiddenCategories: next };
    }),

  setCategoryVisible: (category, visible) =>
    set((state) => {
      const next = new Set(state.hiddenCategories);
      if (visible) next.delete(category);
      else next.add(category);
      return { hiddenCategories: next };
    }),

  setClippingPlane: (axis, value) =>
    set((state) => ({
      clippingPlanes: { ...state.clippingPlanes, [axis]: value },
    })),

  setPlaneEnabled: (axis, enabled) =>
    set((state) => {
      const next = { ...state.planeEnabled, [axis]: enabled };
      return {
        planeEnabled:    next,
        clippingEnabled: next.sagittal || next.axial || next.coronal,
      };
    }),

  setClippingEnabled: (enabled) =>
    set((state) => {
      if (!enabled) {
        // Disable all individual planes
        return {
          clippingEnabled: false,
          planeEnabled: { sagittal: false, axial: false, coronal: false },
        };
      }
      return { clippingEnabled: true };
    }),

  resetClipping: () =>
    set((state) => ({
      // Reset each plane to just below its actual brain minimum (fully uncut)
      clippingPlanes: {
        sagittal: state.brainBounds ? state.brainBounds.xMin - 0.05 : -2,
        axial:    state.brainBounds ? state.brainBounds.yMin - 0.05 : -2,
        coronal:  state.brainBounds ? state.brainBounds.zMin - 0.05 : -2,
      },
      planeEnabled:    { sagittal: false, axial: false, coronal: false },
      clippingEnabled: false,
    })),

  setShowMirroredHemisphere: (show) => set({ showMirroredHemisphere: show }),
  setBrainBounds: (bounds) => set({ brainBounds: bounds }),

  loadBrainRegions: (regions) => {
    const map: Record<string, BrainRegion> = {};
    regions.forEach((r) => { map[r.meshName] = r; });
    set({ brainRegions: regions, regionMap: map });
  },

  setSourcePanelOpen: (isOpen) =>
    set((state) => ({ sourcePanel: { ...state.sourcePanel, isOpen } })),
  setSelectedSource:  (sourceId) =>
    set((state) => ({
      sourcePanel: { ...state.sourcePanel, selectedSourceId: sourceId },
    })),

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, { ...annotation, id: Date.now().toString() }],
    })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    })),
}));
