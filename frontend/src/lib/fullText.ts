/** Legal full-text discovery. Only an openly available PDF may be downloaded. */
export interface FullTextResult {
  pdfUrl: string | null;
  source: string | null;
}

export async function findOpenAccessPdf(pmid?: string, publisherPdfUrls: string[] = []): Promise<FullTextResult> {
  if (!pmid) {
    return publisherPdfUrls[0]
      ? { pdfUrl: publisherPdfUrls[0], source: 'the publisher-provided Crossref link' }
      : { pdfUrl: null, source: null };
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const query = encodeURIComponent(`EXT_ID:${pmid} AND SRC:MED`);
    const response = await fetch(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&resultType=core&format=json`,
      { signal: controller.signal },
    );
    if (!response.ok) return publisherPdfUrls[0]
      ? { pdfUrl: publisherPdfUrls[0], source: 'the publisher-provided Crossref link' }
      : { pdfUrl: null, source: null };
    const json = await response.json();
    const urls = json.resultList?.result?.[0]?.fullTextUrlList?.fullTextUrl ?? [];
    const pdf = urls.find((item: any) => String(item.documentStyle).toLowerCase() === 'pdf' && typeof item.url === 'string');
    return pdf ? { pdfUrl: pdf.url, source: pdf.site ?? 'Europe PMC' } : publisherPdfUrls[0]
      ? { pdfUrl: publisherPdfUrls[0], source: 'the publisher-provided Crossref link' }
      : { pdfUrl: null, source: null };
  } catch {
    return publisherPdfUrls[0]
      ? { pdfUrl: publisherPdfUrls[0], source: 'the publisher-provided Crossref link' }
      : { pdfUrl: null, source: null };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function downloadPdf(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok || !type.toLowerCase().includes('pdf')) {
    throw new Error('The full-text source did not provide a downloadable PDF.');
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
