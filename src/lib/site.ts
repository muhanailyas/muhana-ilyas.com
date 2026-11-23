// Site-wide settings edited in the admin panel (Settings > Site, Contact, CV).
import site from '../../content/settings/site.json';
import contact from '../../content/settings/contact.json';
import cv from '../../content/settings/cv.json';
import { marked } from 'marked';

export type Social = { label: string; url: string };
export type MenuItem = { label: string; href: string };

export const SITE = site as typeof site & { socials: Social[]; menu: MenuItem[] };
export const CONTACT = contact;
export const CV = cv;

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
