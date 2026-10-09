"use client";

import { useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  MoreHorizontal,
  Trash2,
  Video,
  Type,
  Music,
  Eye,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { useEditor } from "@/editor/use-editor";
import {
  canTrackBeHidden,
  canTrackHaveAudio,
  type TimelineTrack,
} from "@/timeline";

export function AddTrackButton() {
  const editor = useEditor();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
          aria-label="Add track"
        >
          <Plus className="size-3.5" />
          Add track
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" finalFocus>
        <DropdownMenuItem
          icon={<Video />}
          onClick={() => editor.timeline.addTrack({ type: "video" })}
        >
          Video / image track
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Type />}
          onClick={() => editor.timeline.addTrack({ type: "text" })}
        >
          Text track
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<Music />}
          onClick={() => editor.timeline.addTrack({ type: "audio" })}
        >
          Audio track
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TrackActions({
  track,
  index,
  count,
}: {
  track: TimelineTrack;
  index: number;
  count: number;
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const editorRoot = useRef<HTMLElement | null>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={(node) => {
            trigger.current = node;
            if (node)
              editorRoot.current = node.closest<HTMLElement>(
                "[data-video-editor]",
              );
          }}
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          aria-label={`Track ${index + 1} actions`}
          title={`${track.name} · Track ${index + 1}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48"
        finalFocus={() => trigger.current ?? editorRoot.current ?? false}
      >
        <TrackMenuItems track={track} index={index} count={count} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TrackMenuItems({
  track,
  index,
  count,
  context = false,
}: {
  track: TimelineTrack;
  index: number;
  count: number;
  context?: boolean;
}) {
  const editor = useEditor();
  const Item = context ? ContextMenuItem : DropdownMenuItem;
  return (
    <>
      <Item
        icon={<ArrowUp />}
        disabled={index === 0}
        onClick={() =>
          editor.timeline.moveTrack({ trackId: track.id, index: index - 1 })
        }
      >
        Move track up
      </Item>
      <Item
        icon={<ArrowDown />}
        disabled={index === count - 1}
        onClick={() =>
          editor.timeline.moveTrack({ trackId: track.id, index: index + 1 })
        }
      >
        Move track down
      </Item>
      <Item
        icon={<Plus />}
        onClick={() => editor.timeline.addTrack({ type: track.type, index })}
      >
        Add track above
      </Item>
      <Item
        icon={<Plus />}
        onClick={() =>
          editor.timeline.addTrack({ type: track.type, index: index + 1 })
        }
      >
        Add track below
      </Item>
      {canTrackHaveAudio(track) && (
        <Item
          icon={<Volume2 />}
          onClick={() => editor.timeline.toggleTrackMute({ trackId: track.id })}
        >
          {track.muted ? "Unmute track" : "Mute track"}
        </Item>
      )}
      {canTrackBeHidden(track) && (
        <Item
          icon={<Eye />}
          onClick={() =>
            editor.timeline.toggleTrackVisibility({ trackId: track.id })
          }
        >
          {track.hidden ? "Show track" : "Hide track"}
        </Item>
      )}
      <Item
        icon={<Trash2 />}
        variant="destructive"
        onClick={() => editor.timeline.removeTrack({ trackId: track.id })}
      >
        Delete track
      </Item>
    </>
  );
}
