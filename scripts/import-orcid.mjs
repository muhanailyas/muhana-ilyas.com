// Import new publications from ORCID (+ Crossref for full details).
//
// What it does: reads every DOI on your ORCID record, skips DOIs already in
// content/publications, and writes one new .md file for each new paper, with authors,
// journal, volume, pages and abstract filled in. Existing files are never changed.
//
// How to run without a computer: GitHub > your repository > Actions >
// "Import publications from ORCID" > Run workflow. (See docs/ADMIN-GUIDE.md.)
// On a computer: `npm run import:orcid`.
//
// Optional: set CROSSREF_MAILTO (a repository variable) to your email so Crossref
// routes requests to its faster "polite" pool.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORCID = process.env.ORCID_ID || '0000-0002-0176-9773';
const DIR = path.resolve('content/publications');
const MAILTO = process.env.CROSSREF_MAILTO ? ` (mailto:${process.env.CROSSREF_MAILTO})` : '';
const UA = `personal-site publication importer${MAILTO}`;

const getJSON = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.json();
};

const decode = (s = '') =>
  s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

const slugify = (year, title) =>
  `${year}-${title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ')
    .filter((w) => w && !['a', 'an', 'the', 'of', 'in', 'on', 'and', 'for', 'with', 'to', 'among', 'by'].includes(w))
    .slice(0, 6).join('-')}`;

const q = (v) => JSON.stringify(v);
const NOT_A_PERSON = /department|faculty|universit|hospital|school|institute/i;

async function existingDois() {
  const set = new Set();
  for (const f of await readdir(DIR)) {
    if (!f.endsWith('.md')) continue;
    const m = (await readFile(path.join(DIR, f), 'utf8')).match(/^doi:\s*"?([^"\n]+)"?/m);
    if (m) set.add(m[1].trim().toLowerCase());
  }
  return set;
}

const TYPE = { 'journal-article': 'journal', 'posted-content': 'preprint', 'book-chapter': 'book-chapter', 'proceedings-article': 'conference', book: 'book' };

async function main() {
  const have = await existingDois();
  const works = await getJSON(`https://pub.orcid.org/v3.0/${ORCID}/works`, { Accept: 'application/json' });
  const dois = new Set();
  for (const g of works.group ?? []) {
    for (const id of g['external-ids']?.['external-id'] ?? []) {
      if (id['external-id-type'] === 'doi') dois.add(id['external-id-value'].toLowerCase());
    }
  }
  const fresh = [...dois].filter((d) => !have.has(d));
  console.log(`ORCID lists ${dois.size} DOIs; ${fresh.length} are new.`);
  const files = new Set(await readdir(DIR));

  for (const doi of fresh) {
    try {
      const { message: m } = await getJSON(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      const title = decode(m.title?.[0] ?? '');
      if (!title) { console.log(`  skipped ${doi}: no title on Crossref`); continue; }
      const parts = (m.published ?? m.issued)?.['date-parts']?.[0] ?? [];
      const authors = (m.author ?? [])
        .map((a) => (a.family ? `${a.given ?? ''} ${a.family}`.trim() : a.name ?? ''))
        .filter((a) => a && !NOT_A_PERSON.test(a))
        .map((a) => { const p = a.split(' '); return p.length === 2 && p[0] === p[1] ? p[0] : a; });
      const abstract = decode(m.abstract).replace(/^abstract\s*[:.]?\s*/i, '');
      const lines = ['---', `title: ${q(title)}`, 'authors:', ...authors.map((a) => `  - ${q(a)}`),
        `type: ${q(TYPE[m.type] ?? 'other')}`];
      if (m['container-title']?.[0]) lines.push(`journal: ${q(decode(m['container-title'][0]))}`);
      if (parts[0]) lines.push(`year: ${parts[0]}`);
      if (parts[1]) lines.push(`month: ${parts[1]}`);
      if (m.volume) lines.push(`volume: ${q(m.volume)}`);
      if (m.issue) lines.push(`issue: ${q(m.issue)}`);
      if (m.page || m['article-number']) lines.push(`pages: ${q(m.page ?? m['article-number'])}`);
      lines.push(`doi: ${q(m.DOI)}`);
      if (abstract) lines.push(`abstract: ${q(abstract)}`);
      lines.push('selected: false', 'show_altmetric: true', 'show_dimensions: true', '---', '');
      let name = slugify(parts[0] ?? 'undated', title);
      while (files.has(`${name}.md`)) name += '-2';
      files.add(`${name}.md`);
      await writeFile(path.join(DIR, `${name}.md`), lines.join('\n'));
      console.log(`  added ${name}.md`);
    } catch (e) {
      console.log(`  skipped ${doi}: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
