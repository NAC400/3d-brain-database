// ---------------------------------------------------------------------------
// Source & StructureLink types — Pillar 2 Academic Research Engine
// ---------------------------------------------------------------------------

/** A single markdown note with version history. */
export interface NoteVersion {
  content:   string;
  savedAt:   string;   // ISO date string
}

export interface Note {
  id:        string;
  content:   string;   // current markdown content
  createdAt: string;
  updatedAt: string;
  versions:  NoteVersion[];  // previous saves, newest last
}

export interface Source {
  id:          string;       // UUID (from Supabase or locally generated)
  userId?:     string;       // null = global/shared
  title:       string;
  authors:     string[];
  doi?:        string;
  url?:        string;
  abstract?:   string;
  journal?:    string;
  year?:       number;
  pmid?:       string;       // PubMed ID — used to lazily fetch abstract via EFetch
  tags:        string[];
  isGlobal:    boolean;      // shared to global atlas
  createdAt:   string;       // ISO date string
  notes:       Note[];       // markdown notes attached to this source
  highlightColor?: string;   // custom color for linked brain regions
}

// Links a Source to one or more brain region mesh names
export interface StructureLink {
  id:             string;
  sourceId:       string;
  regionMeshName: string;   // matches GLB mesh name / BrainRegion.meshName
  regionName:     string;   // denormalized for display
  verified:       boolean;
  createdAt:      string;
}

// Result from PubMed E-utilities search
export interface PubMedResult {
  pmid:     string;
  title:    string;
  authors:  string[];
  journal:  string;
  year:     number;
  abstract: string;
  doi?:     string;
}

// Result from CrossRef DOI lookup
export interface CrossRefResult {
  title:    string;
  authors:  string[];
  journal:  string;
  year:     number;
  doi:      string;
  url:      string;
  abstract?: string;
}
