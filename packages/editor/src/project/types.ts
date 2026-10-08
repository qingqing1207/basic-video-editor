import type { FrameRate } from "@basic-video-editor/render-wasm";
import type { TimelineData } from "@/timeline/types";
import type { MediaTime } from "@/wasm";

export type TBackground =
  | {
      type: "color";
      color: string;
    }
  | {
      type: "blur";
      blurIntensity: number;
    };

export interface TCanvasSize {
  width: number;
  height: number;
}

export interface TProjectMetadata {
  id: string;
  name: string;
  thumbnail?: string;
  duration: MediaTime;
  createdAt: Date;
  updatedAt: Date;
}

export interface TProjectSettings {
  fps: FrameRate;
  canvasSize: TCanvasSize;
  canvasSizeMode?: "preset" | "custom";
  lastCustomCanvasSize?: TCanvasSize | null;
  originalCanvasSize?: TCanvasSize | null;
  background: TBackground;
}

export interface TTimelineViewState {
  zoomLevel: number;
  scrollLeft: number;
  playheadTime: MediaTime;
}

export interface TProject {
  metadata: TProjectMetadata;
  timeline: TimelineData;
  settings: TProjectSettings;
  version: number;
  timelineViewState?: TTimelineViewState;
}
