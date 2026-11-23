// Turns raw publication entries into display-ready objects:
// fills gaps from pasted BibTeX, builds the citation text and marks your own name.
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseBibtex, splitBibAuthors, bibMonth, toBibtex } from './bibtex';
import { SITE } from './site';

export type Pub = {
  id: string;
  title: string;
  abbr?: string;
  authors: string[];
  type: string;
  journal?: string;
  publisher?: string;
  year?: number;
  month?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  pdf?: string;
  code?: string;
  slides?: string;
  abstract?: string;
  note?: string;
  selected: boolean;
  selectedOrder: number;
  showAltmetric: boolean;
  showDimensions: boolean;
  bibtex: string;
};

export const TYPE_LABELS: Record<string, string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  book: 'Book',
  'book-chapter': 'Book chapter',
  preprint: 'Preprint',
  thesis: 'Thesis',
  other: 'Other',
};

function fromEntry(e: CollectionEntry<'publications'>): Pub {
  const d = e.data;
  const bib = parseBibtex(d.bibtex);
  const f = bib?.fields ?? {};
  const bibType = bib?.type;
  const inferredType = bibType === 'inproceedings' || bibType === 'conference' ? 'conference'
    : bibType === 'incollection' || bibType === 'inbook' ? 'book-chapter'
    : bibType === 'book' ? 'book'
    : bibType === 'misc' || bibType === 'unpublished' ? 'preprint'
    : undefined;

  const pub: Omit<Pub, 'bibtex'> = {
    id: e.id,
    title: d.title ?? f.title ?? 'Untitled',
    abbr: d.abbr,
    authors: d.authors.length ? d.authors : splitBibAuthors(f.author),
    type: d.bibtex && !e.data.title && inferredType ? inferredType : d.type,
    journal: d.journal ?? f.journal ?? f.booktitle ?? f.howpublished,
    publisher: d.publisher ?? f.publisher,
    year: d.year ?? (f.year ? parseInt(f.year, 10) : undefined),
    month: d.month ?? bibMonth(f.month),
    volume: d.volume ?? f.volume,
    issue: d.issue ?? f.number,
    pages: d.pages ?? f.pages,
    doi: d.doi ?? f.doi,
    url: d.url ?? f.url,
    pdf: d.pdf,
    code: d.code,
    slides: d.slides,
    abstract: d.abstract ?? f.abstract,
    note: d.note,
    selected: d.selected,
    selectedOrder: d.selected_order ?? 99,
    showAltmetric: d.show_altmetric && SITE.show_altmetric,
    showDimensions: d.show_dimensions && SITE.show_dimensions,
  };
  return { ...pub, bibtex: d.bibtex ?? toBibtex(pub) };
}

/** All visible publications, newest first. */
export async function getPublications(): Promise<Pub[]> {
  const entries = await getCollection('publications', (e) => !e.data.hidden);
  return entries
    .map(fromEntry)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0) || a.title.localeCompare(b.title));
}

/** Publications ticked "Selected" in the admin panel, in the chosen order. */
export async function getSelected(): Promise<Pub[]> {
  return (await getPublications()).filter((p) => p.selected).sort((a, b) => a.selectedOrder - b.selectedOrder);
}

// ---------- your name in bold ----------

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const VARIANTS = new Set((SITE.my_name_variants ?? []).map(norm));
const LAST = norm(SITE.last_name);
const FIRST_INITIAL = norm(SITE.first_names).charAt(0);

/** True if an author string refers to you (exact variant, or surname plus matching first initial). */
export function isMe(author: string): boolean {
  const n = norm(author);
  if (VARIANTS.has(n)) return true;
  const parts = n.split(' ');
  if (!parts.includes(LAST)) return false;
  const others = parts.filter((p) => p !== LAST);
  return others.length > 0 && others[0].charAt(0) === FIRST_INITIAL;
}

/**
 * Author list for display. Long consortium lists are shortened to the first three names,
 * your own name and the total count, so large GBD papers stay readable.
 */
export function authorParts(authors: string[], max = 10): { name: string; me: boolean }[] | { name: string; me: boolean; gap?: boolean }[] {
  const all = authors.map((name) => ({ name, me: isMe(name) }));
  if (all.length <= max) return all;
  const meIdx = all.findIndex((a) => a.me);
  const head = all.slice(0, 3);
  const out: { name: string; me: boolean; gap?: boolean }[] = [...head];
  if (meIdx >= 3) {
    out.push({ name: '…', me: false, gap: true }, all[meIdx]);
  }
  out.push({ name: `… (${all.length} authors)`, me: false, gap: true });
  return out;
}

/** "Epilepsia Open 10(2):571-580" */
export function venueLine(p: Pub): string {
  let s = p.journal ?? p.publisher ?? '';
  if (p.type === 'book' && p.publisher && p.journal !== p.publisher) s = p.publisher;
  const vol = p.volume ? ` ${p.volume}${p.issue ? `(${p.issue})` : ''}` : '';
  const pages = p.pages ? `${vol ? ':' : ' '}${p.pages}` : '';
  return `${s}${vol}${pages}`.trim();
}

export function pubUrl(p: Pub): string {
  return `/publications/${p.id}/`;
}
