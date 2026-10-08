"use client";
import "../react/style.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toast } from "@base-ui/react/toast";
import { Download, MoreHorizontal, MoveHorizontal } from "lucide-react";
import { EditorUIContext } from "@/react/ui-context";
import { useEditorTheme, ResolvedThemeContext } from "./use-editor-theme";
import type {
  EditorAppearance,
  EditorDensity,
  EditorThemeMode,
} from "./tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AudioWaveform } from "@/timeline/components/audio-waveform";
import {
  Section,
  SectionHeader,
  SectionTitle,
  SectionContent,
  SectionFields,
  SectionField,
} from "@/components/section";

export interface EditorThemePreviewProps {
  theme?: EditorThemeMode;
  appearance?: EditorAppearance;
  density?: EditorDensity;
  portalContainer?: HTMLElement | null;
}
/** Optional developer gallery. Does not create an editor or open/store any project. */
export function EditorThemePreview({
  theme = "light",
  appearance,
  density = "compact",
  portalContainer,
}: EditorThemePreviewProps) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const { themeStyle, snapshot } = useEditorTheme({
    root,
    portal,
    theme,
    appearance,
    density,
  });
  const [manager] = useState(() => Toast.createToastManager());
  const portalElement = (
    <div
      ref={setPortal}
      className={`bve-scope ${theme}`}
      data-density={density}
      data-editor-portals=""
    />
  );
  return (
    <ResolvedThemeContext.Provider value={snapshot}>
      <EditorUIContext.Provider
        value={{ portalContainer: portal, theme, setTheme: () => {} }}
      >
        <Toast.Provider toastManager={manager}>
          <div
            ref={setRoot}
            className={`bve-scope ${theme}`}
            style={themeStyle}
            data-density={density}
            data-theme-preview=""
          >
            <TooltipProvider>
              <div
                className="bg-background text-foreground bve-panel-spacing grid gap-4"
                style={{
                  alignItems: "start",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                }}
              >
                <SampleCard title="Buttons">
                  <div className="flex flex-wrap bve-field-gap">
                    <Button variant="primary">
                      <Download />
                      Export
                    </Button>
                    <Button variant="outline">Secondary</Button>
                    <Button variant="ghost" size="icon" aria-label="More tools">
                      <MoreHorizontal />
                    </Button>
                    <Button variant="destructive">Delete</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                  <div className="flex items-center bve-field-gap">
                    <Button size="sm" variant="outline">
                      Small
                    </Button>
                    <Button size="md" variant="outline">
                      Medium
                    </Button>
                    <Button size="lg" variant="outline">
                      Large
                    </Button>
                  </div>
                </SampleCard>
                <SampleCard title="Fields">
                  <SampleFields />
                </SampleCard>
                <SampleCard title="Overlays">
                  <div className="flex flex-wrap bve-field-gap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">Menu</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Rename project</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            More actions
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem>
                              Duplicate project
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem disabled>
                          Unavailable
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Project settings</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                          <Input
                            aria-label="Dialog project name"
                            defaultValue="Local project"
                          />
                        </DialogBody>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="primary">Done</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Popover</Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        Appearance follows the editor theme.
                      </PopoverContent>
                    </Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">Tooltip</Button>
                      </TooltipTrigger>
                      <TooltipContent>Keyboard focus and hover</TooltipContent>
                    </Tooltip>
                    <Button
                      variant="outline"
                      onClick={() =>
                        manager.add({
                          title: "Project saved",
                          description: "Local changes are saved.",
                          timeout: 5000,
                        })
                      }
                    >
                      Toast
                    </Button>
                  </div>
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div className="rounded-control border border-dashed bve-panel-spacing">
                        Right click for track actions
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>Move up</ContextMenuItem>
                      <ContextMenuItem>Move down</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </SampleCard>
                <SampleCard title="Track colors and Canvas waveform">
                  <SampleTimeline />
                </SampleCard>
                <SampleCard title="Tabs and feedback">
                  <Tabs defaultValue="transform">
                    <TabsList>
                      <TabsTrigger value="transform">Transform</TabsTrigger>
                      <TabsTrigger value="audio">Audio</TabsTrigger>
                    </TabsList>
                    <TabsContent value="transform">
                      <p className="text-muted-foreground">
                        Position, scale and rotation
                      </p>
                    </TabsContent>
                    <TabsContent value="audio">
                      <p>Volume and speed</p>
                    </TabsContent>
                  </Tabs>
                  <p className="text-constructive">Saved locally</p>
                  <p className="text-caution">Missing font: using fallback</p>
                  <p className="text-destructive">Unable to save project</p>
                </SampleCard>
              </div>
            </TooltipProvider>
            {!portalContainer && portalElement}
          </div>
          {portalContainer && createPortal(portalElement, portalContainer)}
          <SampleToasts portal={portal} />
        </Toast.Provider>
      </EditorUIContext.Provider>
    </ResolvedThemeContext.Provider>
  );
}
function SampleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel border">
      <Section showBottomBorder={false}>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <div className="flex flex-col bve-section-gap">{children}</div>
        </SectionContent>
      </Section>
    </section>
  );
}
function SampleFields() {
  const [scale, setScale] = useState("100");
  const [slider, setSlider] = useState([40]);
  return (
    <SectionFields>
      <SectionField label="Project name">
        <Input aria-label="Project name" defaultValue="Local project" />
      </SectionField>
      <SectionField label="Scale">
        <NumberField
          aria-label="Scale"
          icon={<MoveHorizontal />}
          value={scale}
          onChange={(event) => setScale(event.target.value)}
          onScrub={(value) => setScale(String(value))}
          suffix="%"
        />
      </SectionField>
      <Select defaultValue="fit">
        <SelectTrigger aria-label="Preview zoom">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit">Fit</SelectItem>
          <SelectItem value="100">100%</SelectItem>
        </SelectContent>
      </Select>
      <Input
        aria-label="Invalid input"
        defaultValue="Invalid value"
        aria-invalid="true"
      />
      <Input
        aria-label="Disabled input"
        defaultValue="Disabled input"
        disabled
      />
      <Textarea aria-label="Project notes" placeholder="Project notes" />
      <div className="flex items-center bve-field-gap">
        <Checkbox aria-label="Include audio" defaultChecked />
        <span>Include audio</span>
        <Switch aria-label="Snapping" defaultChecked />
      </div>
      <Slider
        aria-label="Sample zoom"
        value={slider}
        onValueChange={setSlider}
        min={0}
        max={100}
      />
      <RadioGroup aria-label="Export format" defaultValue="mp4">
        <label className="flex items-center bve-field-gap">
          <RadioGroupItem value="mp4" />
          MP4
        </label>
        <label className="flex items-center bve-field-gap">
          <RadioGroupItem value="webm" />
          WebM
        </label>
      </RadioGroup>
    </SectionFields>
  );
}
function SampleTimeline() {
  const [buffer, setBuffer] = useState<AudioBuffer>();
  useEffect(() => {
    const audio = new AudioBuffer({
      length: 48000,
      sampleRate: 48000,
      numberOfChannels: 1,
    });
    const channel = audio.getChannelData(0);
    for (let i = 0; i < channel.length; i++)
      channel[i] =
        Math.sin(i * 0.06) * (0.2 + 0.7 * Math.abs(Math.sin(i / 3200)));
    setBuffer(audio);
  }, []);
  return (
    <div className="relative flex flex-col gap-1.5" data-theme-sample-tracks="">
      <div
        className="bve-track-video rounded-sm bve-panel-spacing"
        style={{ height: 65 }}
      >
        Video / image
      </div>
      <div
        className="bve-track-text rounded-sm px-2"
        style={{ height: 25, color: "var(--bve-track-label-color)" }}
      >
        Text / captions
      </div>
      <div
        className="bve-track-audio rounded-sm relative overflow-hidden"
        style={{ height: 50 }}
      >
        {buffer && (
          <AudioWaveform
            sourceKey="theme-preview-generated-wave"
            audioBuffer={buffer}
            pixelsPerSecond={500}
            clipDurationSec={1}
            sourceStartSec={0}
          />
        )}
      </div>
      <div className="bve-drop-indicator" />
      <div
        className="bve-playhead absolute top-0 bottom-0 w-0.5"
        style={{ left: "40%" }}
      />
      <div
        className="bve-snap-line absolute top-0 bottom-0 w-0.5 opacity-40"
        style={{ left: "65%" }}
      />
    </div>
  );
}
function SampleToasts({ portal }: { portal: HTMLElement | null }) {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal container={portal}>
      <Toast.Viewport className="bve-overlay-layer fixed right-4 bottom-4 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="bve-overlay bve-panel-spacing"
          >
            <Toast.Content>
              <Toast.Title />
              <Toast.Description className="text-muted-foreground text-sm" />
              <Toast.Close aria-label="Dismiss notification">×</Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
