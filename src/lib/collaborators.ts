// Collaborating institutions and funders (Admin > Collaborations and funding).
import { getCollection, type CollectionEntry } from 'astro:content';

export type Collaborator = CollectionEntry<'collaborators'>;

const byOrderThenName = (a: Collaborator, b: Collaborator) =>
  (a.data.order ?? 999) - (b.data.order ?? 999) || a.data.name.localeCompare(b.data.name);

export async function getCollaborators(): Promise<Collaborator[]> {
  return (await getCollection('collaborators', (c) => !c.data.hidden)).sort(byOrderThenName);
}

/** Collaborators and funders linked to one project (the "Projects" field on each collaborator). */
export async function forProject(projectId: string): Promise<Collaborator[]> {
  return (await getCollaborators()).filter((c) => c.data.projects.includes(projectId));
}

/** Text shown in the box until a logo is uploaded: the short name, or the initials of the name. */
export function initials(c: Collaborator): string {
  if (c.data.short_name) return c.data.short_name;
  return c.data.name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 5);
}
