// ---------------------------------------------------------------------------
// Source & StructureLink types — Pillar 2 Academic Research Engine
// ---------------------------------------------------------------------------

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
