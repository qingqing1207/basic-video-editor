import type { ElementAnimations } from "@/animation/types";
import type { Mask } from "@/masks/types";
import type { ParamValues } from "@/params";
import type { MediaTime } from "@/wasm";

export type ElementRef = {
  trackId: string;
  elementId: string;
};

export interface Bookmark {
  time: MediaTime;
  note?: string;
  color?: string;
  duration?: MediaTime;
}

export interface TimelineData {
  tracks: TimelineTracks;
  bookmarks: Bookmark[];
}

export type TrackType = "video" | "text" | "audio";

interface BaseTrack {
  id: string;
  name: string;
}

export interface VideoTrack extends BaseTrack {
  type: "video";
  elements: (VideoElement | ImageElement)[];
  muted: boolean;
  hidden: boolean;
}

export interface TextTrack extends BaseTrack {
  type: "text";
  elements: TextElement[];
  hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  elements: AudioElement[];
  muted: boolean;
}

export type TimelineTrack = VideoTrack | TextTrack | AudioTrack;

export type OverlayTrack = VideoTrack | TextTrack;

export interface TimelineTracks {
  /** Display and compositing order, top to bottom. IDs remain stable on reorder. */
  order?: string[];
  overlay: OverlayTrack[];
  main: VideoTrack;
  audio: AudioTrack[];
}

export interface RetimeConfig {
  rate: number;
  maintainPitch?: boolean;
}

interface BaseAudioElement extends BaseTimelineElement {
  type: "audio";
  buffer?: AudioBuffer;
  retime?: RetimeConfig;
}

export interface UploadAudioElement extends BaseAudioElement {
  sourceType: "upload";
  mediaId: string;
}

export type AudioElement = UploadAudioElement;

interface BaseTimelineElement {
  id: string;
  name: string;
  duration: MediaTime;
  startTime: MediaTime;
  trimStart: MediaTime;
  trimEnd: MediaTime;
  sourceDuration?: MediaTime;
  animations?: ElementAnimations;
  params: ParamValues;
}

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  mediaId: string;
  isSourceAudioEnabled?: boolean;
  hidden?: boolean;
  retime?: RetimeConfig;
  masks?: Mask[];
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  mediaId: string;
  hidden?: boolean;
  masks?: Mask[];
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  hidden?: boolean;
}

export type ElementUpdatePatch = { params?: Partial<ParamValues> };

export type TimelineElement =
  | AudioElement
  | VideoElement
  | ImageElement
  | TextElement;

export type ElementType = TimelineElement["type"];

function elementTypes<T extends ElementType[]>(...types: T): T {
  return types;
}

export const MASKABLE_ELEMENT_TYPES = elementTypes("video", "image");

export type MaskableElement = Extract<
  TimelineElement,
  { type: (typeof MASKABLE_ELEMENT_TYPES)[number] }
>;

export const RETIMABLE_ELEMENT_TYPES = elementTypes("video", "audio");

export type RetimableElement = Extract<
  TimelineElement,
  { type: (typeof RETIMABLE_ELEMENT_TYPES)[number] }
>;

export const VISUAL_ELEMENT_TYPES = elementTypes("video", "image", "text");

export type VisualElement = Extract<
  TimelineElement,
  { type: (typeof VISUAL_ELEMENT_TYPES)[number] }
>;

export type CreateUploadAudioElement = Omit<UploadAudioElement, "id">;
export type CreateAudioElement = CreateUploadAudioElement;
export type CreateVideoElement = Omit<VideoElement, "id">;
export type CreateImageElement = Omit<ImageElement, "id">;
export type CreateTextElement = Omit<TextElement, "id">;
export type CreateTimelineElement =
  | CreateAudioElement
  | CreateVideoElement
  | CreateImageElement
  | CreateTextElement;

export interface ElementDragState {
  isDragging: boolean;
  elementId: string | null;
  dragElementIds: string[];
  dragTimeOffsets: Record<string, MediaTime>;
  trackId: string | null;
  startMouseX: number;
  startMouseY: number;
  startElementTime: MediaTime;
  clickOffsetTime: MediaTime;
  currentTime: MediaTime;
  currentMouseY: number;
}

export type ElementDragView =
  | { readonly kind: "idle" }
  | {
      readonly kind: "dragging";
      readonly anchorElementId: string;
      readonly trackId: string;
      readonly memberTimeOffsets: ReadonlyMap<string, MediaTime>;
      readonly startMouseX: number;
      readonly startMouseY: number;
      readonly startElementTime: MediaTime;
      readonly clickOffsetTime: MediaTime;
      readonly currentTime: MediaTime;
      readonly currentMouseX: number;
      readonly currentMouseY: number;
      readonly dropTarget: DropTarget | null;
    };

export interface DropTarget {
  trackIndex: number;
  isNewTrack: boolean;
  insertPosition: "above" | "below" | null;
  xPosition: MediaTime;
}

export interface ComputeDropTargetParams {
  getExtraHeight?: (trackIndex: number) => number;
  elementType: ElementType;
  mouseX: number;
  mouseY: number;
  tracks: TimelineTracks;
  playheadTime: MediaTime;
  isExternalDrop: boolean;
  elementDuration: MediaTime;
  pixelsPerSecond: number;
  zoomLevel: number;
  verticalDragDirection?: "up" | "down" | null;
  startTimeOverride?: MediaTime;
  excludeElementId?: string;
}

export interface ClipboardItem {
  trackId: string;
  trackType: TrackType;
  element: CreateTimelineElement;
}
