// brain.ts — shared TypeScript types for the MAPPED platform.
//
// These types are intentionally decoupled from Zustand state so they can be
// imported by components, API helpers, and Supabase query functions without
// pulling in the store.
//
// TODO: expand these as each phase is built out.

// ---------------------------------------------------------------------------
// 3D Model
// ---------------------------------------------------------------------------

/** One anatomical region as it appears in the .glb mesh hierarchy. */
export interface BrainRegion {
  id: string;
  name: string;
  anatomicalId: string;       // Allen Brain Atlas structure acronym (e.g. "HIP")
  meshName: string;           // exact name of the mesh node inside brain.glb
  depthLayer: number;         // 0 = outermost (cortex), higher = deeper
  parentId: string | null;
  children: string[];
  description: string;
  color?: string;             // hex override; falls back to Blender material
}

/** Axis-aligned clipping plane positions, normalised to -1 … 1. */
export interface ClippingPlanes {
  sagittal: number;
  coronal: number;
  axial: number;
}

// ---------------------------------------------------------------------------
// Research / Academic Engine (Phase 2)
// ---------------------------------------------------------------------------

/** A single academic source attached to one or more brain regions. */
export interface ResearchSource {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  abstract?: string;
  regionIds: string[];        // which brain regions this source relates to
  tags: string[];
}

/** A user-created annotation pinned to a region. */
export interface Annotation {
  id: string;
  regionId: string;
  content: string;
  createdAt: string;          // ISO 8601
  authorId?: string;          // null for anonymous / local annotations
}

// ---------------------------------------------------------------------------
// Community Platform (Phase 3)
// ---------------------------------------------------------------------------

/** A community post linking a discussion to a brain region or source. */
export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  regionId?: string;
  sourceId?: string;
  authorId: string;
  createdAt: string;
  upvotes: number;
}
