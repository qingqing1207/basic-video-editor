import type { TProject } from "@/project/types";
import type { SerializedProject } from "@/services/storage/types";
import { serializeProject, CURRENT_PROJECT_VERSION } from "@/services/storage/serialization";
import { generateUUID } from "@/utils/id";
import { DEFAULT_BACKGROUND_COLOR } from "@/background/color";
import { DEFAULT_CANVAS_SIZE } from "@/canvas/sizes";
import { DEFAULT_FPS } from "@/fps/defaults";
import { buildDefaultTimeline } from "@/timeline/document";
import { calculateTotalDuration } from "@/timeline";

export function buildNewProject({ name }: { name: string }): TProject {
  const timeline = buildDefaultTimeline();
  const now = new Date();
  return {
    metadata: {
      id: generateUUID(),
      name,
      duration: calculateTotalDuration({ tracks: timeline.tracks }),
      createdAt: now,
      updatedAt: now,
    },
    timeline,
    settings: {
      fps: DEFAULT_FPS,
      canvasSize: DEFAULT_CANVAS_SIZE,
      canvasSizeMode: "preset",
      lastCustomCanvasSize: null,
      originalCanvasSize: null,
      background: { type: "color", color: DEFAULT_BACKGROUND_COLOR },
    },
    version: CURRENT_PROJECT_VERSION,
  };
}

/** A new empty project, ready to store with `ProjectRepository.save()` and open later with `editor.openProject(id)`. Needs no editor instance. */
export function createProjectRecord({ name }: { name: string }): SerializedProject {
  return serializeProject(buildNewProject({ name }));
}
