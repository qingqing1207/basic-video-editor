import { describe, expect, it, vi } from "vitest";
import type { SerializedProject } from "@basic-video-editor/editor";
import {
  deleteProjects,
  duplicateProjects,
  filterAndSort,
  listProjects,
  renameProject,
  toSummary,
  type Stores,
} from "../examples/next/app/lib/project-actions";

const project = (id: string, name: string, updatedAt = "2026-01-01T00:00:00.000Z"): SerializedProject =>
  ({
    metadata: { id, name, duration: 120000, createdAt: "2026-01-01T00:00:00.000Z", updatedAt },
    timeline: { tracks: {}, bookmarks: [] },
    settings: {},
    version: 2,
  }) as unknown as SerializedProject;

function fixture(initial: SerializedProject[] = [project("source", "Original")]) {
  const records = new Map(initial.map((p) => [p.metadata.id, p]));
  const media = new Map<string, Array<{ id: string; name: string }>>([["source", [{ id: "asset", name: "clip.mp4" }]]]);
  const stores = {
    projects: {
      list: vi.fn(async () => [...records.values()]),
      read: vi.fn(async (id: string) => records.get(id) ?? null),
      save: vi.fn(async (value: SerializedProject) => void records.set(value.metadata.id, value)),
      delete: vi.fn(async (id: string) => void records.delete(id)),
    },
    assets: {
      list: vi.fn(async (id: string) => (media.get(id) ?? []) as never),
      read: vi.fn(async (id: string, assetId: string) => {
        const entry = media.get(id)?.find((a) => a.id === assetId);
        return entry ? ({ metadata: entry, file: new File(["video"], entry.name) } as never) : null;
      }),
      save: vi.fn(async (id: string, stored: { metadata: { id: string; name: string } }) => {
        media.set(id, [...(media.get(id) ?? []), stored.metadata]);
      }),
      delete: vi.fn(async () => {}),
      deleteProject: vi.fn(async (id: string) => void media.delete(id)),
    },
  };
  return { stores: stores as unknown as Stores & typeof stores, records, media };
}

describe("host project actions", () => {
  it("copies media before committing the new project record, and names it like the original editor did", async () => {
    const { stores, records, media } = fixture();
    const [id] = await duplicateProjects(stores, ["source"], [toSummary(project("source", "Original"))]);
    expect(id).not.toBe("source");
    expect(media.get(id)).toHaveLength(1);
    expect(stores.assets.save.mock.invocationCallOrder[0]).toBeLessThan(stores.projects.save.mock.invocationCallOrder[0]);
    expect(records.get(id)?.metadata.name).toBe("(1) Original");
    expect(records.get("source")?.metadata.name).toBe("Original");
  });

  it("numbers further copies after the highest existing copy", async () => {
    const { stores, records } = fixture();
    const existing = [project("source", "Original"), project("c", "(3) Original")].map(toSummary);
    const [id] = await duplicateProjects(stores, ["source"], existing);
    expect(records.get(id)?.metadata.name).toBe("(4) Original");
  });

  it("does not publish a broken copy when media copy fails, and removes the partial media", async () => {
    const { stores, records } = fixture();
    stores.assets.save.mockRejectedValueOnce(new Error("Quota exceeded"));
    await expect(duplicateProjects(stores, ["source"], [])).rejects.toThrow("Quota exceeded");
    expect(records.size).toBe(1);
    expect(stores.assets.deleteProject).toHaveBeenCalledOnce();
    expect(stores.assets.deleteProject).not.toHaveBeenCalledWith("source");
  });

  it("fails without writing anything when a source project is missing", async () => {
    const { stores } = fixture();
    await expect(duplicateProjects(stores, ["source", "ghost"], [])).rejects.toThrow("ghost");
    expect(stores.projects.save).not.toHaveBeenCalled();
  });

  it("keeps the project record when its media cannot be deleted", async () => {
    const { stores, records } = fixture();
    stores.assets.deleteProject.mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(deleteProjects(stores, ["source"])).rejects.toThrow("Storage unavailable");
    expect(stores.projects.delete).not.toHaveBeenCalled();
    expect(records.has("source")).toBe(true);
  });

  it("deletes media and then the record, once per id", async () => {
    const { stores, records, media } = fixture();
    await deleteProjects(stores, ["source", "source"]);
    expect(stores.assets.deleteProject).toHaveBeenCalledTimes(1);
    expect(records.size).toBe(0);
    expect(media.has("source")).toBe(false);
  });

  it("rejects a blank name and a missing project, and propagates write failures", async () => {
    const { stores, records } = fixture();
    await expect(renameProject(stores, "source", "  ")).rejects.toThrow("empty");
    await expect(renameProject(stores, "ghost", "x")).rejects.toThrow("not found");
    stores.projects.save.mockRejectedValueOnce(new Error("Write failed"));
    await expect(renameProject(stores, "source", "Changed")).rejects.toThrow("Write failed");
    await renameProject(stores, "source", " Changed ");
    expect(records.get("source")?.metadata.name).toBe("Changed");
  });

  it("lists, filters and sorts summaries", async () => {
    const { stores } = fixture([
      project("a", "Beta", "2026-01-02T00:00:00.000Z"),
      project("b", "alpha", "2026-01-03T00:00:00.000Z"),
      project("c", "Gamma", "2026-01-01T00:00:00.000Z"),
    ]);
    const all = await listProjects(stores);
    const names = (query: string, key: "name" | "updatedAt", order: "asc" | "desc") =>
      filterAndSort([...all], { query, key, order }).map((p) => p.name);
    expect(names("", "name", "asc")).toEqual(["alpha", "Beta", "Gamma"]);
    expect(names("", "updatedAt", "desc")).toEqual(["alpha", "Beta", "Gamma"]);
    expect(names("A", "name", "asc")).toEqual(["alpha", "Beta", "Gamma"]);
    expect(names("gam", "name", "asc")).toEqual(["Gamma"]);
  });
});
