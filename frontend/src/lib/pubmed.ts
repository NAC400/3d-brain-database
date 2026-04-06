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
      } as PubMedResult;
    });
}

// Fetch full abstract for a single PMID via EFetch (XML mode — more reliable than plain text)
export async function fetchAbstract(pmid: string): Promise<string> {
  const res = await fetch(
    `${BASE}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=xml`
  );
  if (!res.ok) return '';
  const xml = await res.text();
  // Extract all <AbstractText> elements (structured abstracts have multiple)
  const matches = xml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
  if (!matches || matches.length === 0) return '';
  return matches
    .map((m) =>
      m
        .replace(/<AbstractText[^>]*>/g, '')
        .replace(/<\/AbstractText>/g, '')
        .replace(/<[^>]+>/g, '')   // strip any nested tags (e.g. <i>, <b>)
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .trim()
    )
    .filter(Boolean)
    .join(' ');
}
