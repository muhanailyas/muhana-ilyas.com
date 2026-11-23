// Minimal BibTeX reader and writer.
// Reading: lets you paste a BibTeX entry in the admin panel instead of filling every field.
// Writing: produces the text shown by the "Cite" button on each publication.

export type BibFields = Record<string, string>;
export type BibEntry = { type: string; key: string; fields: BibFields };

/** Parse the first entry in a BibTeX string. Returns null if nothing usable is found. */
export function parseBibtex(src: string | undefined): BibEntry | null {
  if (!src) return null;
  const head = src.match(/@(\w+)\s*\{\s*([^,\s]*)\s*,/);
  if (!head) return null;
  const fields: BibFields = {};
  let i = (head.index ?? 0) + head[0].length;
  const s = src;
  while (i < s.length) {
    const m = s.slice(i).match(/^\s*([A-Za-z][\w-]*)\s*=\s*/);
    if (!m) break;
    i += m[0].length;
    const name = m[1].toLowerCase();
    let value = '';
    if (s[i] === '{') {
      let depth = 0;
      let j = i;
      for (; j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) break; }
      }
      value = s.slice(i + 1, j);
      i = j + 1;
    } else if (s[i] === '"') {
      const j = s.indexOf('"', i + 1);
      value = s.slice(i + 1, j);
      i = j + 1;
    } else {
      const m2 = s.slice(i).match(/^[^,}\s]+/);
      value = m2 ? m2[0] : '';
      i += value.length;
    }
    fields[name] = clean(value);
    const comma = s.slice(i).match(/^\s*,?/);
    i += comma ? comma[0].length : 0;
  }
  return { type: head[1].toLowerCase(), key: head[2], fields };
}

/** Strip braces and common LaTeX escapes from a BibTeX value. */
function clean(v: string): string {
  return v
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/--/g, '\u2013')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Ilyas, Muhana Fawwazy and Wiyono, Nanang" -> ["Muhana Fawwazy Ilyas", "Nanang Wiyono"] */
export function splitBibAuthors(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(/\s+and\s+/i).map((a) => {
    const t = a.trim();
    if (t.includes(',')) {
      const [last, first] = t.split(',').map((x) => x.trim());
      return `${first} ${last}`.trim();
    }
    return t;
  });
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function bibMonth(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  if (!isNaN(n)) return n;
  const k = MONTHS.indexOf(v.slice(0, 3).toLowerCase());
  return k >= 0 ? k + 1 : undefined;
}

/** "Muhana Fawwazy Ilyas" -> "Ilyas, Muhana Fawwazy" (BibTeX author format) */
function toBibName(name: string): string {
  if (name.includes(',')) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
}

function esc(v: string): string {
  return v.replace(/&/g, '\\&').replace(/%/g, '\\%');
}

export type PubForBib = {
  title?: string; authors: string[]; type: string; journal?: string; publisher?: string;
  year?: number | null; month?: number | null; volume?: string; issue?: string; pages?: string; doi?: string; url?: string;
};

/** Build a BibTeX entry from publication fields. */
export function toBibtex(p: PubForBib): string {
  const first = (p.authors[0] ?? 'anon').trim().split(/\s+/).pop() ?? 'anon';
  const word = (p.title ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').find((w) => w.length > 3) ?? 'work';
  const key = `${first.toLowerCase().replace(/[^a-z]/g, '')}${p.year ?? ''}${word}`;
  const kind = p.type === 'book' ? 'book' : p.type === 'book-chapter' ? 'incollection' : p.type === 'conference' ? 'inproceedings' : p.type === 'preprint' ? 'misc' : p.type === 'thesis' ? 'phdthesis' : 'article';
  const venueField = kind === 'incollection' || kind === 'inproceedings' ? 'booktitle' : kind === 'article' ? 'journal' : 'howpublished';
  const rows: [string, string | undefined][] = [
    ['title', p.title],
    ['author', p.authors.length ? p.authors.map(toBibName).join(' and ') : undefined],
    [venueField, p.journal],
    ['publisher', p.publisher],
    ['year', p.year ? String(p.year) : undefined],
    ['month', p.month ? MONTHS[p.month - 1] : undefined],
    ['volume', p.volume],
    ['number', p.issue],
    ['pages', p.pages?.replace(/\u2013/g, '--')],
    ['doi', p.doi],
    ['url', p.url ?? (p.doi ? `https://doi.org/${p.doi}` : undefined)],
  ];
  const body = rows.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${esc(String(v))}}`).join(',\n');
  return `@${kind}{${key},\n${body}\n}`;
}
