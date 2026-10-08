import type { Mutate, StoreApi } from "zustand";
import { createJSONStorage } from "zustand/middleware";
import { usePanelStore } from "@/editor/panel-store";
import { usePreviewStore } from "@/preview/preview-store";
import { useTimelineStore } from "@/timeline/timeline-store";
import { useKeybindingsStore } from "@/actions/keybindings-store";
import { useAssetsPanelStore } from "@/components/editor/panels/assets/assets-panel-store";
import { usePropertiesStore } from "@/components/editor/panels/properties/stores/properties-store";
import { resetCustomPresets } from "@/timeline/components/graph-editor/custom-presets-store";

export async function initializePreferences(
  namespace = "basic-video-editor-v1",
) {
  await resetStore(usePanelStore, namespace);
  await resetStore(usePreviewStore, namespace);
  await resetStore(useTimelineStore, namespace);
  await resetStore(useKeybindingsStore, namespace);
  await resetStore(useAssetsPanelStore, namespace);
  usePropertiesStore.setState(usePropertiesStore.getInitialState(), true);
  resetCustomPresets(namespace);
}

async function resetStore<T, P>(
  store: Mutate<StoreApi<T>, [["zustand/persist", P]]>,
  namespace: string,
) {
  const name = (store.persist.getOptions().name ?? "preferences")
    .split(":")
    .at(-1)!;
  const storage = store.persist.getOptions().storage;
  store.persist.setOptions({
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  store.setState(store.getInitialState(), true);
  store.persist.setOptions({
    name: `${namespace}:${name}`,
    storage: storage ?? createJSONStorage<P>(() => localStorage),
  });
  await store.persist.rehydrate();
}
