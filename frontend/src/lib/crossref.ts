/**
 * CrossRef API helper — free, no API key, polite pool recommended
 * Docs: https://api.crossref.org/swagger-ui/index.html
 */

import type { CrossRefResult, ResearchSearchResult } from '../types/source';

const BASE = 'https://api.crossref.org/works';

function toCrossRefResult(w: any, fallbackDoi = ''): CrossRefResult {
  const doi = w.DOI ?? fallbackDoi;
  const authors = (w.author ?? []).map((a: any) => [a.given, a.family].filter(Boolean).join(' '));
  const title = Array.isArray(w.title) ? w.title[0] : (w.title ?? '');
  const journal = Array.isArray(w['container-title']) ? w['container-title'][0] : (w['container-title'] ?? '');
  const year = w.published?.['date-parts']?.[0]?.[0]
    ?? w['published-print']?.['date-parts']?.[0]?.[0]
    ?? w['published-online']?.['date-parts']?.[0]?.[0] ?? 0;
  const abstract = w.abstract ? w.abstract.replace(/<[^>]+>/g, '').trim() : '';
  const fullTextUrls: string[] = (w.link ?? [])
    .filter((link: any) => link['content-type'] === 'application/pdf' && typeof link.URL === 'string')
    .map((link: any) => link.URL);
  return {
    title, authors, journal, year: Number(year), doi,
    url: w.URL ?? (doi ? `https://doi.org/${doi}` : ''),
    abstract: abstract || undefined,
    volume: w.volume ? String(w.volume) : undefined,
    issue: w.issue ? String(w.issue) : undefined,
    pages: w.page ? String(w.page) : undefined,
    fullTextUrls,
  };
}

// Lookup a DOI and return structured metadata
export async function lookupDOI(doi: string): Promise<CrossRefResult | null> {
  // Normalise — strip URL prefix if user pasted a full DOI URL
  const cleanDoi = doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .trim();

  const res = await fetch(`${BASE}/${encodeURIComponent(cleanDoi)}`, {
    headers: { 'User-Agent': 'MAPPED-BrainPlatform/1.0 (contact@mapped.app)' },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`CrossRef lookup failed: ${res.status}`);

  const json = await res.json();
  const w = json.message;

  return toCrossRefResult(w, cleanDoi);
}

/** Search Crossref's open scholarly metadata index by title, author, or topic. */
export async function searchCrossref(query: string, maxResults = 10): Promise<ResearchSearchResult[]> {
  const res = await fetch(`${BASE}?query.bibliographic=${encodeURIComponent(query)}&rows=${maxResults}`);
  if (!res.ok) throw new Error(`Crossref search failed: ${res.status}`);
  const items: any[] = (await res.json()).message?.items ?? [];
  return items.map((item, index) => {
    const result = toCrossRefResult(item);
    return { id: result.doi || `crossref-${index}-${result.title}`, provider: 'Crossref' as const, ...result };
  }).filter((result) => Boolean(result.title));
}
