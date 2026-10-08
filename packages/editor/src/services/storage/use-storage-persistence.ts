"use client";

import { useEffect, useState } from "react";

import { useEditor } from "@/editor/use-editor";

function isFirefox(): boolean {
  return navigator.userAgent.toLowerCase().includes("firefox");
}

export function useStoragePersistence() {
  const editor = useEditor();
  const DISMISSED_KEY = `${editor.options.storageNamespace ?? "basic-video-editor-v1"}:storage-persist-dismissed`;
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!navigator.storage?.persist) return;

    const run = async () => {
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) return;

      const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
      if (dismissed) return;

      if (isFirefox()) {
        setShowDialog(true);
      } else {
        await navigator.storage.persist();
      }
    };

    run();
  }, [DISMISSED_KEY]);

  const onConfirm = async () => {
    setShowDialog(false);
    await navigator.storage.persist();
  };

  const onDismiss = () => {
    setShowDialog(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  return { showDialog, onConfirm, onDismiss };
}
