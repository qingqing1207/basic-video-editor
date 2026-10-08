import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PANEL_CONFIG } from "@/panels/layout";

export interface PanelSizes {
  tools: number;
  preview: number;
  properties: number;
  mainContent: number;
  timeline: number;
}

export type PanelId = keyof PanelSizes;

interface PanelState {
  panels: PanelSizes;
  setPanel: (args: { panel: PanelId; size: number }) => void;
  setPanels: (sizes: Partial<PanelSizes>) => void;
  resetPanels: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      ...PANEL_CONFIG,
      setPanel: ({ panel, size }) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: size,
          },
        })),
      setPanels: (sizes) =>
        set((state) => ({
          panels: {
            ...state.panels,
            ...sizes,
          },
        })),
      resetPanels: () => set({ ...PANEL_CONFIG }),
    }),
    {
      name: "basic-video-editor-v1:panel-sizes",
      partialize: (state) => ({
        panels: state.panels,
      }),
      version: 1,
      skipHydration: true,
    },
  ),
);
