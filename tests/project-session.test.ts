import { describe, expect, it, vi } from "vitest";
vi.mock("@/core/notify", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/services/renderer/canvas-renderer", () => ({ CanvasRenderer: class {} }));
vi.mock("@/services/renderer/scene-builder", () => ({ buildScene: vi.fn() }));
import { ProjectManager } from "@/core/managers/project-manager";
import { buildNewProject, createProjectRecord } from "@/project/record";
import { deserializeProject, serializeProject } from "@/services/storage/serialization";
import type { EditorCore } from "@/core";

function manager() {
  const editor = {
    storage: { saveProject: vi.fn(async (_: unknown) => {}) },
    media: { clearAllAssets: vi.fn() },
    document: { initialize: vi.fn(), clear: vi.fn() },
    save: { markDirty: vi.fn() },
  };
  return { editor, manager: new ProjectManager(editor as unknown as EditorCore) };
}

describe("new project record", () => {
  it("is a JSON-safe, current-version, empty project that needs no editor instance", () => {
    const record = createProjectRecord({ name: "Demo" });
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
    expect(record.version).toBe(2);
    expect(record.metadata.name).toBe("Demo");
    expect(record.metadata.duration).toBe(0);
    expect(typeof record.metadata.createdAt).toBe("string");
    expect(createProjectRecord({ name: "Demo" }).metadata.id).not.toBe(record.metadata.id);
  });
  it("round-trips through serialization and rejects unsupported versions", () => {
    const project = buildNewProject({ name: "Round trip" });
    const restored = deserializeProject(serializeProject(project));
    expect(restored.metadata.createdAt).toEqual(project.metadata.createdAt);
    expect(restored.metadata.createdAt).toBeInstanceOf(Date);
    expect(() => deserializeProject({ ...serializeProject(project), version: 1 })).toThrow("Unsupported");
  });
});

describe("open project session", () => {
  it("creates, activates and saves a new project", async () => {
    const { manager: projects, editor } = manager();
    const id = await projects.createNewProject({ name: "Fresh" });
    expect(projects.getActive().metadata.id).toBe(id);
    expect(editor.storage.saveProject).toHaveBeenCalledOnce();
    expect(editor.document.initialize).toHaveBeenCalledOnce();
  });
  it("renames only the open project, trimming the name and leaving the save to autosave", async () => {
    const { manager: projects, editor } = manager();
    expect(() => projects.renameActiveProject({ name: "x" })).toThrow("No active project");
    await projects.createNewProject({ name: "Fresh" });
    editor.save.markDirty.mockClear();
    expect(() => projects.renameActiveProject({ name: "   " })).toThrow("empty");
    projects.renameActiveProject({ name: "  Renamed  " });
    expect(projects.getActive().metadata.name).toBe("Renamed");
    expect(editor.save.markDirty).toHaveBeenCalledOnce();
  });
});
