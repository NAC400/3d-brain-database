import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Source, StructureLink, Note } from '../types/source';

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
  'Telencephalon – Frontal Lobe',
  'Telencephalon – Parietal Lobe',
  'Telencephalon – Temporal Lobe',
  'Telencephalon – Occipital Lobe',
  'Telencephalon – Limbic Lobe',
  'Telencephalon – Insula',
  'Telencephalon – Hippocampus & Amygdala',
  'Telencephalon – Basal Ganglia',
  'Telencephalon – Cerebral Nuclei',
  'Telencephalon – Olfactory / Paleocortex',
  'Telencephalon – Cortex (Other)',
  // Diencephalon — subdivided from Allen hierarchy (parentName chain)
  'Diencephalon – Thalamus',
  'Diencephalon – Hypothalamus',
  'Diencephalon – Epithalamus',
  'Diencephalon – Subthalamus',
  'Diencephalon',                     // catch-all for unclassified diencephalic structures
  // Mesencephalon — subdivided from Allen hierarchy
  'Mesencephalon – Tectum',
  'Mesencephalon – Tegmentum',
  'Mesencephalon – Substantia Nigra',
  'Mesencephalon (Midbrain)',          // catch-all
  'Metencephalon (Pons)',
  'Metencephalon (Cerebellum)',
  'Myelencephalon (Medulla)',
  'White Matter',
  'Ventricles & CSF',
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

  // --- Layer visibility (opt-in: empty = all visible, non-empty = only these visible) ---
  activeCategories: Set<string>;

  // --- Clipping planes ---
  clippingPlanes:  ClippingPlanes;
  planeEnabled:    PlaneEnabled;   // per-axis enable; clippingEnabled = any plane active
  clippingEnabled: boolean;        // true when at least one plane is active (derived, kept for compat)

  // --- Full-brain mirror ---
  showMirroredHemisphere: boolean;

  // --- World-space bounds (set once GLB loads) ---
  brainBounds: BrainBounds | null;

  // --- Camera target (drives animated zoom-to-region) ---
  // Position + lookAt in world space. CameraController inside Canvas reads this.
  cameraTarget: { position: [number,number,number]; lookAt: [number,number,number] } | null;

  // --- Per-mesh world-space centroids (set by BrainModel after GLB loads) ---
  regionCentroids:    Record<string, [number,number,number]>;
  // Per-mesh normalised outward directions (mm, pre-scale) — used to compute exploded centroid
  regionCentroidDirs: Record<string, [number,number,number]>;

  // --- Region data ---
  brainRegions: BrainRegion[];
  regionMap:    Record<string, BrainRegion>;  // meshName → BrainRegion

  // --- Source / research panel ---
  sourcePanel: SourcePanelState;

  // --- Research / Pillar 2 ---
  sources:           Source[];
  structureLinks:    StructureLink[];
  researchPanelOpen: boolean;
  viewingSourceId:   string | null;  // source open in full-page viewer

  // --- App page routing ---
  appPage: 'home' | 'explorer' | 'library' | 'community' | 'auth';

  // --- Annotations ---
  annotations: any[];

  // --- Allen descriptions (labelId → anatomical description) ---
  regionDescriptions: Record<number, string>;

  // --- Annotation/Note system (Phase 2D) ---
  // Notes keyed by meshName — separate from source notes which live on Source.notes[]
  structureNotes: Record<string, Note[]>;
  // Per-mesh custom highlight color (overrides default region color when set)
  highlightColors: Record<string, string>;
  // Whether highlight-paint mode is active
  highlightMode: boolean;

  // --- Auth / user state (Phase 3A) ---
  user: { id: string; email: string; plan: 'free' | 'pro' | 'institutional' } | null;
  isAuthLoading: boolean;

  // --- Context menu ---
  contextMenu: { meshName: string; x: number; y: number } | null;

  // --- Actions ---
  setSelectedRegion:  (regionId: string | null) => void;
  setHoveredRegion:   (regionId: string | null) => void;
  setViewMode:        (mode: BrainState['viewMode']) => void;
  setLoading:         (loading: boolean) => void;

  setExplodeAmount:   (amount: number) => void;
  setIsolatedRegion:  (regionId: string | null) => void;

  toggleCategory:     (category: string) => void;  // toggles opt-in selection
  setCategoryVisible: (category: string, visible: boolean) => void;

  setClippingPlane:   (axis: keyof ClippingPlanes, value: number) => void;
  setPlaneEnabled:    (axis: keyof PlaneEnabled, enabled: boolean) => void;
  setClippingEnabled: (enabled: boolean) => void;
  resetClipping:      () => void;

  setShowMirroredHemisphere: (show: boolean) => void;
  setBrainBounds:            (bounds: BrainBounds) => void;
  setCameraTarget:           (target: BrainState['cameraTarget']) => void;
  setRegionCentroids:        (centroids: Record<string, [number,number,number]>) => void;
  setRegionCentroidDirs:     (dirs: Record<string, [number,number,number]>) => void;
  setRegionDescriptions:     (descs: Record<number, string>) => void;

  loadBrainRegions:   (regions: BrainRegion[]) => void;

  setSourcePanelOpen: (isOpen: boolean) => void;
  setSelectedSource:  (sourceId: string | null) => void;

  addAnnotation:    (annotation: any) => void;
  removeAnnotation: (id: string) => void;

  // Research actions
  addSource:          (source: Source) => void;
  removeSource:       (id: string) => void;
  updateSource:       (id: string, updates: Partial<Source>) => void;
  addStructureLink:   (link: StructureLink) => void;
  removeStructureLink:(id: string) => void;
  setResearchPanelOpen: (open: boolean) => void;
  setViewingSourceId:   (id: string | null) => void;
  setAppPage:           (page: BrainState['appPage']) => void;
  getSourcesForRegion: (meshName: string) => Source[];

  // Annotation actions (Phase 2D)
  addStructureNote:    (meshName: string, note: Note) => void;
  updateStructureNote: (meshName: string, noteId: string, content: string) => void;
  removeStructureNote: (meshName: string, noteId: string) => void;
  setHighlightColor:   (meshName: string, color: string | null) => void;
  setHighlightMode:    (active: boolean) => void;

  // Auth actions (Phase 3A)
  setUser:         (user: BrainState['user']) => void;
  setAuthLoading:  (loading: boolean) => void;

  // Context menu
  setContextMenu:  (menu: BrainState['contextMenu']) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBrainStore = create<BrainState>()(
  persist(
    (set, get) => ({
  // Visual
  selectedRegion: null,
  hoveredRegion:  null,
  viewMode:       'normal',
  isLoading:      false,

  // Dissection
  explodeAmount:  0,
  isolatedRegion: null,

  // Layer visibility (empty = all visible; opt-in: adding a category shows only those)
  activeCategories: new Set<string>(),

  // Clipping — default values are -2 (outside brain bounds) so enabling a plane
  // doesn't immediately cut the brain; user slides right to start cutting.
  clippingPlanes:  { sagittal: -2, axial: -2, coronal: -2 },
  planeEnabled:    { sagittal: false, axial: false, coronal: false },
  clippingEnabled: false,

  // Mirror
  showMirroredHemisphere: false,
  brainBounds: null,

  // Camera
  cameraTarget: null,
  regionCentroids: {},
  regionCentroidDirs: {},

  // Allen descriptions
  regionDescriptions: {},

  // Data
  brainRegions: [],
  regionMap:    {},

  // Source panel
  sourcePanel: { isOpen: false, selectedSourceId: null },

  // Research
  sources: [],
  structureLinks: [],
  researchPanelOpen: false,
  viewingSourceId: null,

  // Routing
  appPage: 'home',

  // Annotations
  annotations: [],

  // Phase 2D
  structureNotes: {},
  highlightColors: {},
  highlightMode: false,

  // Auth
  user: null,
  isAuthLoading: false,

  // Context menu
  contextMenu: null,

  // --- Actions ---
  setSelectedRegion: (regionId) => set({ selectedRegion: regionId }),
  setHoveredRegion:  (regionId) => set({ hoveredRegion: regionId }),
  setViewMode:       (mode)     => set({ viewMode: mode }),
  setLoading:        (loading)  => set({ isLoading: loading }),

  setExplodeAmount:  (amount) =>
    set({ explodeAmount: Math.max(0, Math.min(1, amount)) }),
  setIsolatedRegion: (regionId) => set({ isolatedRegion: regionId }),

  // Opt-in toggle: select/deselect a category for focused viewing
  toggleCategory: (category) =>
    set((state) => {
      const next = new Set(state.activeCategories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { activeCategories: next };
    }),

  // Explicitly show/hide a category relative to current selection
  setCategoryVisible: (category, visible) =>
    set((state) => {
      const next = new Set(state.activeCategories);
      if (visible) next.add(category);
      else next.delete(category);
      return { activeCategories: next };
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
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setRegionCentroids: (centroids) => set({ regionCentroids: centroids }),
  setRegionCentroidDirs: (dirs) => set({ regionCentroidDirs: dirs }),
  setRegionDescriptions: (descs) => set({ regionDescriptions: descs }),

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

  // Research
  addSource: (source) =>
    set((state) => ({ sources: [...state.sources, source] })),
  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      structureLinks: state.structureLinks.filter((l) => l.sourceId !== id),
    })),
  updateSource: (id, updates) =>
    set((state) => ({
      sources: state.sources.map((s) => s.id === id ? { ...s, ...updates } : s),
    })),
  addStructureLink: (link) =>
    set((state) => ({ structureLinks: [...state.structureLinks, link] })),
  removeStructureLink: (id) =>
    set((state) => ({
      structureLinks: state.structureLinks.filter((l) => l.id !== id),
    })),
  setResearchPanelOpen: (open) => set({ researchPanelOpen: open }),
  setViewingSourceId: (id) => set({ viewingSourceId: id }),
  setAppPage: (page) => set({ appPage: page }),
  getSourcesForRegion: (meshName) => {
    const { structureLinks, sources } = get();
    const linkedIds = new Set(
      structureLinks
        .filter((l: StructureLink) => l.regionMeshName === meshName)
        .map((l: StructureLink) => l.sourceId)
    );
    return sources.filter((s: Source) => linkedIds.has(s.id));
  },

  // --- Annotation / note actions ---
  addStructureNote: (meshName, note) =>
    set((state) => ({
      structureNotes: {
        ...state.structureNotes,
        [meshName]: [...(state.structureNotes[meshName] ?? []), note],
      },
    })),

  updateStructureNote: (meshName, noteId, content) =>
    set((state) => {
      const notes = state.structureNotes[meshName] ?? [];
      return {
        structureNotes: {
          ...state.structureNotes,
          [meshName]: notes.map((n: Note) => {
            if (n.id !== noteId) return n;
            const now = new Date().toISOString();
            return {
              ...n,
              content,
              updatedAt: now,
              versions: [...n.versions, { content: n.content, savedAt: now }],
            };
          }),
        },
      };
    }),

  removeStructureNote: (meshName, noteId) =>
    set((state) => ({
      structureNotes: {
        ...state.structureNotes,
        [meshName]: (state.structureNotes[meshName] ?? []).filter((n: Note) => n.id !== noteId),
      },
    })),

  setHighlightColor: (meshName, color) =>
    set((state) => {
      const next = { ...state.highlightColors };
      if (color === null) delete next[meshName];
      else next[meshName] = color;
      return { highlightColors: next };
    }),

  setHighlightMode: (active) => set({ highlightMode: active }),

  // --- Auth actions ---
  setUser:        (user)    => set({ user }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  // --- Context menu ---
  setContextMenu: (menu) => set({ contextMenu: menu }),
}),
{
  name: 'mapped-brain-store',   // localStorage key
  storage: createJSONStorage(() => localStorage),

  // Only persist user-data fields — not 3D runtime state (centroids, bounds, etc.)
  // activeCategories is a Set and is intentionally excluded (resets to empty = all visible)
  partialize: (state) => ({
    sources:         state.sources,
    structureLinks:  state.structureLinks,
    structureNotes:  state.structureNotes,
    highlightColors: state.highlightColors,
    user:            state.user,
  }),
}
)
);

// Re-export types for convenience
export type { Source, StructureLink };
