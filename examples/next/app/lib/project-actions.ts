import type { AssetStore, ProjectStore, SerializedProject } from "@basic-video-editor/editor";

export type ProjectSortKey = "createdAt" | "updatedAt" | "name" | "duration";
export type SortOrder = "asc" | "desc";

export interface ProjectSummary {
  id: string;
  name: string;
  thumbnail?: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stores {
  projects: ProjectStore;
  assets: AssetStore;
}

export function toSummary({ metadata }: SerializedProject): ProjectSummary {
  return {
    id: metadata.id,
    name: metadata.name,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    createdAt: new Date(metadata.createdAt),
    updatedAt: new Date(metadata.updatedAt),
  };
}

export async function listProjects({ projects }: Pick<Stores, "projects">) {
  return (await projects.list()).map(toSummary);
}

export function filterAndSort(
  projects: ProjectSummary[],
  { query, key, order }: { query: string; key: ProjectSortKey; order: SortOrder },
) {
  const needle = query.trim().toLowerCase();
  const sign = order === "asc" ? 1 : -1;
  return projects
    .filter((project) => project.name.toLowerCase().includes(needle))
    .sort((a, b) => {
      const left = key === "name" ? a.name.toLowerCase() : key === "duration" ? a.duration : a[key].getTime();
      const right = key === "name" ? b.name.toLowerCase() : key === "duration" ? b.duration : b[key].getTime();
      return left < right ? -sign : left > right ? sign : 0;
    });
}

export async function renameProject({ projects }: Pick<Stores, "projects">, id: string, name: string) {
  const next = name.trim();
  if (!next) throw new Error("Project name cannot be empty");
  const project = await projects.read(id);
  if (!project) throw new Error(`Project not found: ${id}`);
  await projects.save({
    ...project,
    metadata: { ...project.metadata, name: next, updatedAt: new Date().toISOString() },
  });
}

const duplicateName = (name: string) => {
  const match = name.match(/^\((\d+)\)\s+(.+)$/);
  return { base: match ? match[2] : name, number: match ? Number.parseInt(match[1], 10) : null };
};

/**
 * Copies projects together with their media. A copy becomes visible (its project record is saved)
 * only after all of its media has been copied; a failed copy removes its partial media.
 */
export async function duplicateProjects(
  { projects, assets }: Stores,
  ids: string[],
  existing: ProjectSummary[],
) {
  const unique = Array.from(new Set(ids));
  const sources = await Promise.all(unique.map((id) => projects.read(id)));
  const missing = unique.filter((_, index) => !sources[index]);
  if (missing.length) throw new Error(`Projects not found: ${missing.join(", ")}`);

  const nextNumber = new Map<string, number>();
  for (const { name } of existing) {
    const { base, number } = duplicateName(name);
    if (number !== null) nextNumber.set(base, Math.max(nextNumber.get(base) ?? 0, number + 1));
  }

  const created: string[] = [];
  for (const source of sources as SerializedProject[]) {
    const { base } = duplicateName(source.metadata.name);
    const number = nextNumber.get(base) ?? 1;
    nextNumber.set(base, number + 1);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const copy: SerializedProject = {
      ...source,
      metadata: { ...source.metadata, id, name: `(${number}) ${base}`, createdAt: now, updatedAt: now },
    };
    try {
      for (const entry of await assets.list(source.metadata.id)) {
        const stored = await assets.read(source.metadata.id, entry.id);
        if (!stored) throw new Error(`Missing media: ${entry.name} (${entry.id})`);
        await assets.save(id, stored);
      }
      await projects.save(copy);
    } catch (error) {
      await assets.deleteProject(id).catch(() => {});
      throw error;
    }
    created.push(id);
  }
  return created;
}

/** Removes a project's media first; the record is kept if the media cannot be removed. */
export async function deleteProjects({ projects, assets }: Stores, ids: string[]) {
  await Promise.all(
    Array.from(new Set(ids)).map(async (id) => {
      await assets.deleteProject(id);
      await projects.delete(id);
    }),
  );
}
