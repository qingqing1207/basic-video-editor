import type { TProject } from "@/project/types";
import type { SerializedProject } from "./types";

export const CURRENT_PROJECT_VERSION = 2;

/** JSON-safe project record: dates become ISO strings, runtime-only audio buffers and undefined values are dropped. */
export function serializeProject(project: TProject): SerializedProject {
  const value: SerializedProject = {
    ...project,
    version: CURRENT_PROJECT_VERSION,
    metadata: {
      ...project.metadata,
      createdAt: project.metadata.createdAt.toISOString(),
      updatedAt: project.metadata.updatedAt.toISOString(),
    },
    timeline: {
      tracks: {
        ...project.timeline.tracks,
        audio: project.timeline.tracks.audio.map((track) => ({
          ...track,
          elements: track.elements.map(({ buffer, ...element }) => element),
        })),
      },
      bookmarks: project.timeline.bookmarks,
    },
  };
  return JSON.parse(JSON.stringify(value));
}

export function deserializeProject(value: SerializedProject): TProject {
  if (value.version !== CURRENT_PROJECT_VERSION)
    throw new Error(`Unsupported local project version: ${value.version}`);
  return {
    ...value,
    metadata: {
      ...value.metadata,
      createdAt: new Date(value.metadata.createdAt),
      updatedAt: new Date(value.metadata.updatedAt),
    },
  };
}
