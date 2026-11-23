// Site-wide settings edited in the admin panel (Settings > Site, Contact, CV).
import site from '../../content/settings/site.json';
import contact from '../../content/settings/contact.json';
import cv from '../../content/settings/cv.json';
// pages.json is optional: if it is missing, every page falls back to its default title and introduction.
const pagesFound = import.meta.glob('../../content/settings/pages.json', { eager: true, import: 'default' });
const pages: Record<string, { title?: string; intro?: string }> = (Object.values(pagesFound)[0] as any) ?? {};
import { marked } from 'marked';

export type Social = { label: string; url: string };
export type MenuItem = { label: string; href: string };

export const SITE = site as typeof site & { socials: Social[]; menu: MenuItem[] };
export const CONTACT = contact;
export const CV = cv;

type PageKey = 'projects' | 'skills' | 'collaborations' | 'publications' | 'repositories' | 'teaching' | 'blog' | 'contact' | 'cv';
/**
 * Page title and introduction, edited in Admin > Settings > Page titles and introductions.
 * Placeholders in the introduction are filled in automatically:
 * {count} = number of items on the page, {scholar} = your Google Scholar link, {github} = your GitHub link.
 */
export function pageText(key: PageKey, fallbackTitle: string, vars: Record<string, string | number> = {}, fallbackIntro = '') {
  const p = (pages[key] ?? {}) as { title?: string; intro?: string };
  const link = (re: RegExp) => SITE.socials.find((s) => re.test(s.label))?.url ?? '#';
  const all: Record<string, string | number> = { scholar: link(/scholar/i), github: link(/github/i), ...vars };
  const intro = (p.intro ?? fallbackIntro).replace(/\{(\w+)\}/g, (m, k) => (k in all ? String(all[k]) : m));
  return { title: p.title || fallbackTitle, intro: intro ? mdInline(intro) : '' };
}

/** Render a short markdown string (bio paragraphs, news lines) to HTML. */
export function md(text: string | undefined | null): string {
  if (!text) return '';
  return marked.parse(text, { async: false }) as string;
}

/** Same as md() but without the wrapping <p>, for one-line snippets. */
export function mdInline(text: string | undefined | null): string {
  if (!text) return '';
  return marked.parseInline(text, { async: false }) as string;
}

/** "Nov 19, 2026" */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** "Nov 2026" */
export function fmtMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Approximate reading time for a markdown body. */
export function readingTime(body: string | undefined): string {
  const words = (body ?? '').replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/** Sort helper: entries with an explicit `order` first (ascending), then the rest. */
export function byOrder<T extends { data: { order?: number | null } }>(a: T, b: T): number {
  const oa = a.data.order ?? Number.MAX_SAFE_INTEGER;
  const ob = b.data.order ?? Number.MAX_SAFE_INTEGER;
  return oa - ob;
}
