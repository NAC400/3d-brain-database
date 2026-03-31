/**
 * CrossRef API helper — free, no API key, polite pool recommended
 * Docs: https://api.crossref.org/swagger-ui/index.html
 */

import type { CrossRefResult } from '../types/source';

const BASE = 'https://api.crossref.org/works';

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

  const authors = (w.author ?? []).map(
    (a: any) => [a.given, a.family].filter(Boolean).join(' ')
  );

  const title = Array.isArray(w.title) ? w.title[0] : (w.title ?? '');
  const journal = Array.isArray(w['container-title'])
    ? w['container-title'][0]
    : (w['container-title'] ?? '');

  const year =
    w.published?.['date-parts']?.[0]?.[0] ??
    w['published-print']?.['date-parts']?.[0]?.[0] ??
    w['published-online']?.['date-parts']?.[0]?.[0] ?? 0;

  const abstract: string = w.abstract
    ? w.abstract.replace(/<[^>]+>/g, '').trim()  // strip JATS XML tags
    : '';

  return {
    title,
    authors,
    journal,
    year: Number(year),
    doi: cleanDoi,
    url: w.URL ?? `https://doi.org/${cleanDoi}`,
    abstract: abstract || undefined,
  };
}
