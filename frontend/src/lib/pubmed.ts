/**
 * PubMed E-utilities helpers — NCBI free API, no key required for <3 req/s
 * Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

import type { PubMedResult } from '../types/source';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// Search PubMed by keyword query, returns up to `maxResults` PMIDs then fetches summaries
export async function searchPubMed(query: string, maxResults = 10): Promise<PubMedResult[]> {
  // Step 1: ESearch — get PMIDs
  const searchRes = await fetch(
    `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&format=json`
  );
  if (!searchRes.ok) throw new Error('PubMed search failed');
  const searchJson = await searchRes.json();
  const ids: string[] = searchJson.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  // Step 2: ESummary — get metadata for those PMIDs
  return fetchByPMIDs(ids);
}

// Fetch PubMed metadata for a list of PMIDs
export async function fetchByPMIDs(pmids: string[]): Promise<PubMedResult[]> {
  if (pmids.length === 0) return [];
  const summaryRes = await fetch(
    `${BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&format=json`
  );
  if (!summaryRes.ok) throw new Error('PubMed summary fetch failed');
  const summaryJson = await summaryRes.json();
  const result = summaryJson.result ?? {};

  return pmids
    .filter((id) => result[id] && !result[id].error)
    .map((id) => {
      const r = result[id];
      const authors = (r.authors ?? []).map((a: any) => a.name as string);
      const doi = (r.articleids ?? []).find((x: any) => x.idtype === 'doi')?.value;
      return {
        pmid:    id,
        title:   r.title ?? '',
        authors,
        journal: r.fulljournalname ?? r.source ?? '',
        year:    parseInt(r.pubdate?.split(' ')[0]) || 0,
        abstract: '', // ESummary doesn't include abstract; use EFetch if needed
        doi,
        volume: r.volume ? String(r.volume) : undefined,
        issue: r.issue ? String(r.issue) : undefined,
        pages: r.pages ? String(r.pages) : undefined,
      } as PubMedResult;
    });
}

// Fetch full abstract via Europe PMC search API (resultType=core includes abstractText).
// The /article endpoint returns a LITE record with no abstract; the search endpoint
// with resultType=core returns the full record including abstractText.
// Europe PMC has proper CORS headers; NCBI EFetch does not.
export type AbstractResult = { abstract: string; error?: string };

export async function fetchAbstract(pmid: string): Promise<AbstractResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const query = encodeURIComponent(`EXT_ID:${pmid} AND SRC:MED`);
    const res = await fetch(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&resultType=core&format=json`,
      { signal: controller.signal },
    );
    if (!res.ok) return { abstract: '', error: `Europe PMC returned ${res.status}.` };
    const json = await res.json();
    const raw: string = json.resultList?.result?.[0]?.abstractText ?? '';
    const abstract = raw.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return abstract ? { abstract } : { abstract: '', error: 'No abstract is available from Europe PMC for this record.' };
  } catch (error) {
    return {
      abstract: '',
      error: error instanceof DOMException && error.name === 'AbortError'
        ? 'Abstract lookup timed out. Please try again.'
        : 'Abstract lookup could not be completed. Please try again.',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
