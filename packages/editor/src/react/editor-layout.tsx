"use client";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { AssetsPanel } from "@/components/editor/panels/assets";
import { PropertiesPanel } from "@/components/editor/panels/properties";
import { Timeline } from "@/timeline/components";
import { PreviewPanel } from "@/preview/components";
import { EditorHeader } from "@/components/editor/editor-header";
import { usePanelStore } from "@/editor/panel-store";
import { usePasteMedia } from "@/media/use-paste-media";
import { useMemo, useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  createPreviewOverlayControl,
  isPreviewOverlayVisible,
  mergePreviewOverlaySources,
} from "@/preview/overlays";
import { usePreviewStore } from "@/preview/preview-store";
import { getGuidePreviewOverlaySource } from "@/guides";
import {
  bookmarkNotesPreviewOverlay,
  getBookmarkPreviewOverlaySource,
} from "@/timeline/bookmarks/index";

export function DegradedRendererBanner() {
  const isDegraded = useEditor((e) => e.renderer.isDegraded);
  const [dismissed, setDismissed] = useState(false);
  const missingCodecs =
    typeof VideoEncoder === "undefined" || typeof VideoDecoder === "undefined";
  if ((!isDegraded && !missingCodecs) || dismissed) return null;

  return (
    <div className="bg-accent border-b h-9 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span>
        {missingCodecs
          ? "This browser lacks WebCodecs video support. Video editing or export may be unavailable."
          : "WebGPU is unavailable. GPU masks and background blur may be limited."}{" "}
        Use desktop Chrome for full support.
      </span>
      <Button
        variant="text"
        size="icon"
        className="p-0 w-auto [&_svg]:size-3.5"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <HugeiconsIcon icon={Cancel01Icon} />
      </Button>
    </div>
  );
}

export function EditorLayout() {
  usePasteMedia();
  const { panels, setPanel } = usePanelStore();
  const activeTimeline = useEditor((editor) =>
    editor.document.getTimelineOrNull(),
  );
  const currentTime = useEditor((editor) => editor.playback.getCurrentTime());
  const activeGuide = usePreviewStore((state) => state.activeGuide);
  const overlays = usePreviewStore((state) => state.overlays);
  const setOverlayVisibility = usePreviewStore(
    (state) => state.setOverlayVisibility,
  );
  const showBookmarkNotes = isPreviewOverlayVisible({
    overlay: bookmarkNotesPreviewOverlay,
    overlays,
  });

  const overlaySource = useMemo(
    () =>
      mergePreviewOverlaySources({
        sources: [
          getGuidePreviewOverlaySource({
            guideId: activeGuide,
          }),
          activeTimeline
            ? getBookmarkPreviewOverlaySource({
                bookmarks: activeTimeline.bookmarks,
                time: currentTime,
                isVisible: showBookmarkNotes,
              })
            : {
                definitions: [bookmarkNotesPreviewOverlay],
                instances: [],
              },
        ],
      }),
    [activeGuide, activeTimeline, currentTime, showBookmarkNotes],
  );

  const overlayControls = useMemo(
    () =>
      overlaySource.definitions.map((overlay) =>
        createPreviewOverlayControl({ overlay, overlays }),
      ),
    [overlaySource.definitions, overlays],
  );

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="size-full bve-layout-gap"
      onLayout={(sizes) => {
        setPanel({
          panel: "mainContent",
          size: sizes[0] ?? panels.mainContent,
        });
        setPanel({
          panel: "timeline",
          size: sizes[1] ?? panels.timeline,
        });
      }}
    >
      <ResizablePanel
        defaultSize={panels.mainContent}
        minSize={30}
        maxSize={85}
        className="min-h-0"
      >
        <ResizablePanelGroup
          direction="horizontal"
          className="size-full bve-layout-gap bve-layout-inset-x"
          onLayout={(sizes) => {
            setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
            setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
            setPanel({
              panel: "properties",
              size: sizes[2] ?? panels.properties,
            });
          }}
        >
          <ResizablePanel
            defaultSize={panels.tools}
            minSize={15}
            maxSize={40}
            className="min-w-0"
          >
            <AssetsPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={panels.preview}
            minSize={30}
            className="min-h-0 min-w-0 flex-1"
          >
            <PreviewPanel
              overlayControls={overlayControls}
              overlayInstances={overlaySource.instances}
              onOverlayVisibilityChange={setOverlayVisibility}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={panels.properties}
            minSize={15}
            maxSize={40}
            className="min-w-0"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={panels.timeline}
        minSize={15}
        maxSize={70}
        className="min-h-0 bve-layout-inset-x bve-layout-inset-b"
      >
        <Timeline />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
