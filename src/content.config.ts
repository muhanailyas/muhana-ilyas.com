// Content collections: one folder per collection under /content.
// Every file the admin panel saves is checked against these schemas at build time,
// so a broken entry stops the build instead of silently breaking a page.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The admin panel writes empty fields as "" or null; treat both as "not set".
const opt = () => z.string().nullish().transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));
const optNum = () => z.coerce.number().nullish();
const tags = () => z.array(z.string()).nullish().transform((v) => v ?? []);

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/news' }),
  schema: z.object({
    date: z.coerce.date(),
    text: z.string(), // short markdown line, e.g. "New paper in *Epilepsia Open*."
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/publications' }),
  schema: z.object({
    // All descriptive fields are optional because a pasted BibTeX entry can fill them in.
    title: opt(),
    abbr: opt(), // short badge text, e.g. EIMJ, Lancet Neurol
    authors: z.array(z.string()).nullish().transform((v) => v ?? []),
    type: z.enum(['journal', 'conference', 'book', 'book-chapter', 'preprint', 'thesis', 'other']).nullish().transform((v) => v ?? 'journal'),
    journal: opt(),
    publisher: opt(),
    year: optNum(),
    month: optNum(),
    volume: opt(),
    issue: opt(),
    pages: opt(),
    doi: opt(),
    url: opt(),
    pdf: opt(),
    code: opt(),
    slides: opt(),
    abstract: opt(),
    bibtex: opt(),
    note: opt(), // e.g. "Equal contribution", "In Indonesian"
    selected: z.boolean().nullish().transform((v) => !!v),
    selected_order: optNum(),
    show_altmetric: z.boolean().nullish().transform((v) => v ?? true),
    show_dimensions: z.boolean().nullish().transform((v) => v ?? true),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z.object({
    title: z.string(),
    short_title: opt(), // used where space is short, e.g. "APONO"
    summary: z.string(),
    thumbnail: opt(),
    thumbnail_alt: opt(),
    status: z.enum(['active', 'completed', 'planned', 'paused']).nullish().transform((v) => v ?? 'active'),
    tags: tags(),
    start: opt(),
    end: opt(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).nullish().transform((v) => v ?? []),
    // Figures shown on the project page: the first appears under the summary, the rest after the text.
    figures: z
      .array(z.object({ image: z.string(), caption: z.string().nullish(), alt: z.string().nullish() }))
      .nullish()
      .transform((v) => (v ?? []).filter((f) => f.image)),
    order: optNum(),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

// Skills page: one card per skill, laid out like the projects list.
const skills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/skills' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    figure: opt(),
    figure_alt: opt(),
    tools: tags(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).nullish().transform((v) => v ?? []),
    order: optNum(),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

// Collaborating institutions and funders, shown under Projects and on each linked project page.
const collaborators = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/collaborators' }),
  schema: z.object({
    name: z.string(),
    short_name: opt(), // shown in the box until a logo is uploaded, e.g. UGM
    kind: z.enum(['collaboration', 'funding']).nullish().transform((v) => v ?? 'collaboration'),
    region: z.enum(['indonesia', 'international']).nullish().transform((v) => v ?? 'indonesia'),
    logo: opt(),
    url: opt(),
    country: opt(),
    description: opt(), // what we work on together, or the grant / programme name
    year: opt(),
    projects: z.array(z.string()).nullish().transform((v) => v ?? []),
    order: optNum(),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

const repositories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/repositories' }),
  schema: z.object({
    name: z.string(),
    url: z.string(),
    description: z.string(),
    language: opt(),
    stars: optNum(),
    demo: opt(),
    order: optNum(),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

const teaching = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/teaching' }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['course', 'talk', 'workshop', 'lecture', 'supervision', 'other']).nullish().transform((v) => v ?? 'talk'),
    date: z.coerce.date(),
    end_date: z.coerce.date().nullish(),
    institution: opt(),
    location: opt(),
    role: opt(),
    description: opt(),
    slides: opt(),
    link: opt(),
    hidden: z.boolean().nullish().transform((v) => !!v),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: opt(),
    tags: tags(),
    cover: opt(),
    cover_alt: opt(),
    draft: z.boolean().nullish().transform((v) => !!v),
  }),
});

const atlas = defineCollection({
  loader: glob({ pattern: 'atlas.md', base: './content/atlas' }),
  schema: z.object({
    status: z.enum(['coming-soon', 'live']),
    title: z.string(),
    short_title: opt(),
    tagline: opt(),
    coming_soon_message: opt(),
    notify_email: opt(),
    notify_text: opt(),
    embed_url: opt(), // when live: an interactive app to show inside the page
    embed_height: optNum(),
    launch_url: opt(), // when live: a button to open the full atlas in a new tab
    image: opt(),
  }),
});

export const collections = { news, publications, projects, skills, collaborators, repositories, teaching, blog, atlas };
