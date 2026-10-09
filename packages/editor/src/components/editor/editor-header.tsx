"use client";

import { Button } from "../ui/button";
import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ExportButton } from "./export-button";
import { ThemeToggle } from "../theme-toggle";
import { toast } from "@/core/notify";
import { useEditor } from "@/editor/use-editor";
import { CommandIcon, Logout05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShortcutsDialog } from "@/actions/components/shortcuts-dialog";
import { EditorLogo } from "./editor-logo";
import { cn } from "@/utils/ui";
import { useEditorUI } from "@/react/ui-context";

export function EditorHeader() {
  return (
    <header className="flex h-11 items-center justify-between px-3">
      <div className="flex items-center gap-1">
        <ProjectDropdown />
        <EditableProjectName />
      </div>
      <nav className="flex items-center gap-2">
        <ExportButton />
        <ThemeToggle />
      </nav>
    </header>
  );
}

function ProjectDropdown() {
  const [openDialog, setOpenDialog] = useState<"shortcuts" | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const { onExit } = useEditorUI();
  const editor = useEditor();

  const handleExit = async () => {
    if (isExiting) return;
    setIsExiting(true);
    try {
      await editor.project.prepareExit();
      await editor.closeProject();
      await onExit?.();
    } catch (error) {
      toast.error("Unable to close project", { description: String(error) });
    } finally {
      setIsExiting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="p-1 rounded-sm size-8">
            <EditorLogo />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-overlay w-44">
          <DropdownMenuItem
            onClick={handleExit}
            disabled={isExiting}
            icon={<HugeiconsIcon icon={Logout05Icon} />}
          >
            Exit project
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenDialog("shortcuts")}
            icon={<HugeiconsIcon icon={CommandIcon} />}
          >
            Shortcuts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShortcutsDialog
        isOpen={openDialog === "shortcuts"}
        onOpenChange={(isOpen) => setOpenDialog(isOpen ? "shortcuts" : null)}
      />
    </>
  );
}

function EditableProjectName() {
  const editor = useEditor();
  const activeProject = useEditor((e) => e.project.getActive());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalNameRef = useRef("");

  const projectName = activeProject?.metadata.name || "";

  const startEditing = () => {
    if (isEditing) return;
    originalNameRef.current = projectName;
    setIsEditing(true);

    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const saveEdit = async () => {
    if (!inputRef.current || !activeProject) return;
    const newName = inputRef.current.value.trim();
    setIsEditing(false);

    if (!newName) {
      inputRef.current.value = originalNameRef.current;
      return;
    }

    if (newName !== originalNameRef.current) {
      try {
        editor.project.renameActiveProject({ name: newName });
      } catch (error) {
        toast.error("Failed to rename project", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (inputRef.current) {
        inputRef.current.value = originalNameRef.current;
        inputRef.current.setSelectionRange(0, 0);
      }
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={projectName}
      readOnly={!isEditing}
      onClick={startEditing}
      onBlur={saveEdit}
      onKeyDown={handleKeyDown}
      style={{ fieldSizing: "content" }}
      className={cn(
        "text-base h-8 px-2 py-1 rounded-sm bg-transparent outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
        isEditing && "ring-1 ring-ring cursor-text hover:bg-transparent",
      )}
    />
  );
}
