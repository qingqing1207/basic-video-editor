import { useEffect } from "react";
import { invokeAction } from "@/actions";
import { useEditor } from "@/editor/use-editor";
import { useKeybindingsStore } from "@/actions/keybindings-store";
import { isTypableDOMElement } from "@/utils/browser";

/**
 * a composable that hooks to the caller component's
 * lifecycle and hooks to the keyboard events to fire
 * the appropriate actions based on keybindings
 */
export function useKeybindingsListener() {
  const editor = useEditor();
  const {
    keybindings,
    getKeybindingString,
    overlayDepth,
    isLoadingProject,
    isRecording,
  } = useKeybindingsStore();

  useEffect(() => {
    const eventOptions: AddEventListenerOptions = { capture: true };
    let focusFrame: number | undefined;
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (!editor.ownsEvent(ev) || ev.isComposing || ev.keyCode === 229) return;
      const normalizedKey = (ev.key ?? "").toLowerCase();

      if (overlayDepth > 0 || isLoadingProject || isRecording) {
        return;
      }

      const binding = getKeybindingString(ev);
      const activeElement = document.activeElement;
      const isTextInput =
        activeElement instanceof HTMLElement &&
        isTypableDOMElement({ element: activeElement });
      const boundAction = binding ? keybindings.get(binding) : undefined;

      if (normalizedKey === "escape" && isTextInput) {
        activeElement.blur();
        return;
      }

      if (!binding) return;
      if (!boundAction) return;

      if (isTextInput) return;
      if (boundAction === "paste-copied") {
        if (!editor.clipboard.hasEntry()) return;
        ev.preventDefault();
        invokeAction("paste-copied", undefined, "keypress");
        return;
      }

      ev.preventDefault();

      // Undo/delete may replace the focused clip node. Keep keyboard ownership
      // in this editor without reclaiming focus from a host control or overlay.
      const focused = document.activeElement;
      const root = [...editor.activeRoots].find((root) =>
        focused ? root.contains(focused) : false,
      );
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        focusFrame = undefined;
        if (
          root?.isConnected &&
          focused &&
          !focused.isConnected &&
          document.activeElement === document.body
        ) {
          root.focus({ preventScroll: true });
        }
      });

      switch (boundAction) {
        case "seek-forward":
          invokeAction("seek-forward", { seconds: 1 }, "keypress");
          break;
        case "seek-backward":
          invokeAction("seek-backward", { seconds: 1 }, "keypress");
          break;
        case "jump-forward":
          invokeAction("jump-forward", { seconds: 5 }, "keypress");
          break;
        case "jump-backward":
          invokeAction("jump-backward", { seconds: 5 }, "keypress");
          break;
        default:
          invokeAction(boundAction, undefined, "keypress");
      }
    };

    document.addEventListener("keydown", handleKeyDown, eventOptions);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, eventOptions);
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    };
  }, [
    keybindings,
    getKeybindingString,
    overlayDepth,
    isLoadingProject,
    isRecording,
    editor,
  ]);
}
