/**
 * Allen Brain Atlas API helpers
 * Docs: https://api.brain-map.org/api/v2/data/
 *
 * We query the Human Reference Atlas structure ontology to retrieve
 * anatomical descriptions and hierarchy data for the 141 regions in our GLB.
 *
 * The labelId values in regions.json ARE Allen structure IDs, so we can
 * query them directly.
 */

const BASE = 'https://api.brain-map.org/api/v2/data';

export interface AllenStructure {
  id:                 number;
  acronym:            string;
  name:               string;
  description:        string;
  structure_id_path:  string;   // e.g. "/997/8/567/688/695/696/..."
  parent_structure_id: number | null;
}

/** Module-level cache: labelId → AllenStructure */
const _cache = new Map<number, AllenStructure>();
let _fetchPromise: Promise<void> | null = null;

/**
 * Fetch Allen structures for the given labelIds and populate the module cache.
 * Safe to call multiple times — only fetches once.
 */
export async function fetchAllenStructures(labelIds: number[]): Promise<void> {
  // Filter to IDs not yet in cache
  const needed = labelIds.filter((id) => id > 0 && !_cache.has(id));
  if (needed.length === 0) return;

  // Prevent duplicate concurrent fetches
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      // Allen API supports filtering by id list in batches
      // Use num_rows=500 to ensure we get all structures in one call
      const idList = needed.join(',');
      const url =
        `${BASE}/Structure/query.json` +
        `?criteria=id$in[${idList}]` +
        `&only=id,acronym,name,description,structure_id_path,parent_structure_id` +
        `&num_rows=500`;

      const res = await fetch(url);
      if (!res.ok) return;

      const json = await res.json();
      const structures: AllenStructure[] = json.msg ?? [];
      for (const s of structures) {
        _cache.set(s.id, s);
      }
    } catch {
      // Silently degrade — descriptions just won't show
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

/** Get a cached structure by labelId (returns undefined if not yet fetched). */
export function getAllenStructure(labelId: number): AllenStructure | undefined {
  return _cache.get(labelId);
}

/**
 * Return a Record<labelId, description> for all currently cached structures.
 * Call after fetchAllenStructures resolves.
 */
export function getAllenDescriptions(labelIds: number[]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const id of labelIds) {
    const s = _cache.get(id);
    if (s?.description) out[id] = s.description;
  }
  return out;
}
