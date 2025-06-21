import { create } from 'zustand';

export interface BrainRegion {
  id: string;
  name: string;
  anatomicalId: string;
  coordinates: [number, number, number];
  description: string;
  researchData?: any[];
}

export interface BrainState {
  // Visual state
  selectedRegion: string | null;
  showVasculature: boolean;
  showSkull: boolean;
  opacity: number;
  viewMode: 'normal' | 'cross-section' | 'layers' | 'annotations';
  isLoading: boolean;
  
  // Brain regions data
  brainRegions: BrainRegion[];
  
  // Research data
  researchData: any[];
  
  // Annotations
  annotations: any[];
  
  // Actions
  setSelectedRegion: (regionId: string | null) => void;
  setShowVasculature: (show: boolean) => void;
  setShowSkull: (show: boolean) => void;
  setOpacity: (opacity: number) => void;
  setViewMode: (mode: 'normal' | 'cross-section' | 'layers' | 'annotations') => void;
  setLoading: (loading: boolean) => void;
  addAnnotation: (annotation: any) => void;
  removeAnnotation: (id: string) => void;
  loadBrainRegions: (regions: BrainRegion[]) => void;
  loadResearchData: (data: any[]) => void;
}

export const useBrainStore = create<BrainState>((set, get) => ({
  // Initial state
  selectedRegion: null,
  showVasculature: false,
  showSkull: true,
  opacity: 1.0,
  viewMode: 'normal',
  isLoading: false,
  brainRegions: [],
  researchData: [],
  annotations: [],
  
  // Actions
  setSelectedRegion: (regionId) => set({ selectedRegion: regionId }),
  
  setShowVasculature: (show) => set({ showVasculature: show }),
  
  setShowSkull: (show) => set({ showSkull: show }),
  
  setOpacity: (opacity) => set({ opacity: Math.max(0, Math.min(1, opacity)) }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  addAnnotation: (annotation) => set((state) => ({
    annotations: [...state.annotations, { ...annotation, id: Date.now().toString() }]
  })),
  
  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter(ann => ann.id !== id)
  })),
  
  loadBrainRegions: (regions) => set({ brainRegions: regions }),
  
  loadResearchData: (data) => set({ researchData: data }),
}));

// Preset brain regions for initial development
export const PRESET_BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'cortex',
    name: 'Cerebral Cortex',
    anatomicalId: 'CTX',
    coordinates: [0, 0.5, 0],
    description: 'The outer layer of the cerebrum responsible for higher cognitive functions'
  },
  {
    id: 'basal-ganglia',
    name: 'Basal Ganglia',
    anatomicalId: 'BG',
    coordinates: [0, 0, 0],
    description: 'Group of subcortical nuclei involved in motor control and learning'
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    anatomicalId: 'HIP',
    coordinates: [0.8, -0.3, 0],
    description: 'Brain region crucial for memory formation and spatial navigation'
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    anatomicalId: 'AMY',
    coordinates: [0.6, -0.2, -0.3],
    description: 'Almond-shaped structure involved in emotion processing and fear responses'
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    anatomicalId: 'TH',
    coordinates: [0, 0, 0],
    description: 'Relay station for sensory and motor signals to the cortex'
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    anatomicalId: 'CB',
    coordinates: [0, -0.8, -0.5],
    description: 'Brain structure important for motor control, balance, and coordination'
  }
]; 