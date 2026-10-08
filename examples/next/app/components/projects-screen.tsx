"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { createProjectRecord } from "@basic-video-editor/editor";
import { formatDate, formatDuration } from "../lib/format";
import {
  deleteProjects,
  duplicateProjects,
  filterAndSort,
  listProjects,
  renameProject,
  type ProjectSortKey,
  type ProjectSummary,
} from "../lib/project-actions";
import { getRepositories } from "../lib/repositories";
import { useListPrefs } from "../lib/use-list-prefs";
import {
  ArrowDownIcon, Button, CalendarIcon, Checkbox, CopyIcon, Dialog, EditIcon, GridIcon, InfoIcon,
  ListIcon, MoreIcon, PlusIcon, PopupMenu, SearchIcon, TextInput, TrashIcon, VideoIcon, anchorBelow, cx,
  type MenuAnchor, type MenuEntry,
} from "./ui";

const SORT_LABELS: Record<ProjectSortKey, string> = {
  createdAt: "Created",
  updatedAt: "Modified",
  name: "Name",
  duration: "Duration",
};

type DialogState =
  | { type: "rename"; project: ProjectSummary }
  | { type: "delete"; projects: ProjectSummary[] }
  | { type: "info"; project: ProjectSummary }
  | null;

export default function ProjectsScreen() {
  const router = useRouter();
  const { prefs, update, hydrated } = useListPrefs();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [menu, setMenu] = useState<{ anchor: MenuAnchor; items: MenuEntry[] } | null>(null);
  const [sortMenu, setSortMenu] = useState<MenuAnchor | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjects(getRepositories()));
    } catch (error) {
      setProjects([]);
      setToast(`Failed to load projects: ${error instanceof Error ? error.message : error}`);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(
    () => filterAndSort([...(projects ?? [])], { query, key: prefs.sortKey, order: prefs.sortOrder }),
    [projects, query, prefs.sortKey, prefs.sortOrder],
  );
  const visibleIds = visible.map((project) => project.id);
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));

  const run = async (task: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    try {
      await task();
      await refresh();
    } catch (error) {
      setToast(`${failure}: ${error instanceof Error ? error.message : error}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const createProject = () =>
    run(async () => {
      const record = await createProjectRecord({ name: "New project" });
      await getRepositories().projects.save(record);
      router.push(`/editor/${record.metadata.id}`);
    }, "Failed to create project");

  const duplicate = (ids: string[]) =>
    run(async () => {
      await duplicateProjects(getRepositories(), ids, projects ?? []);
      setSelected([]);
    }, "Failed to duplicate projects");

  const toggleSelect = (id: string, event: MouseEvent) => {
    const checked = !selected.includes(id);
    if (event.shiftKey && checked && lastSelected && visibleIds.includes(lastSelected)) {
      const [from, to] = [visibleIds.indexOf(lastSelected), visibleIds.indexOf(id)].sort((a, b) => a - b);
      setSelected((current) => Array.from(new Set([...current, ...visibleIds.slice(from, to + 1)])));
    } else {
      setSelected((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));
    }
    setLastSelected(id);
  };

  const menuFor = (project: ProjectSummary): MenuEntry[] => [
    { label: "Rename", icon: <EditIcon />, onSelect: () => setDialog({ type: "rename", project }) },
    { label: "Duplicate", icon: <CopyIcon />, onSelect: () => void duplicate([project.id]) },
    { label: "Info", icon: <InfoIcon />, onSelect: () => setDialog({ type: "info", project }) },
    "separator",
    { label: "Delete", icon: <TrashIcon />, destructive: true, onSelect: () => setDialog({ type: "delete", projects: [project] }) },
  ];

  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;
  const multi = selectedVisible.length > 1;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-white px-8 pt-2">
        <div className="flex items-center gap-5">
          <h1 className="text-base font-medium">All projects</h1>
          <div className="hidden h-10 items-center gap-1 rounded-lg border border-zinc-200 p-1 md:flex">
            {([["grid", "Grid view", <GridIcon key="g" />], ["list", "List view", <ListIcon key="l" />]] as const).map(
              ([mode, label, icon]) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="icon"
                  className={cx("size-8", hydrated && prefs.viewMode === mode && "bg-zinc-100")}
                  aria-label={label}
                  aria-pressed={hydrated && prefs.viewMode === mode}
                  onClick={() => update({ viewMode: mode })}
                >
                  {icon}
                </Button>
              ),
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <TextInput placeholder="Search..." value={query} onChange={(event) => setQuery(event.target.value)} className="w-64 pl-9" />
          </div>
          <Button size="lg" onClick={createProject} disabled={busy}>
            New project
          </Button>
        </div>
      </header>

      <div className="sticky top-16 z-10 flex h-14 items-center justify-between bg-white px-6 pt-2">
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-3 px-2">
            <Checkbox
              label="Select all"
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onToggle={() => setSelected(allSelected ? [] : visibleIds)}
            />
            <span className="hidden text-sm text-zinc-500 md:block">Select all</span>
          </label>
          <div className="h-4 w-px bg-zinc-200" />
          <Button variant="ghost" className="px-2 text-zinc-500" onClick={(event) => setSortMenu(anchorBelow(event.currentTarget))}>
            {SORT_LABELS[prefs.sortKey]}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500"
            aria-label={`Sort ${prefs.sortOrder === "asc" ? "ascending" : "descending"}`}
            onClick={() => update({ sortOrder: prefs.sortOrder === "asc" ? "desc" : "asc" })}
          >
            <ArrowDownIcon className={prefs.sortOrder === "asc" ? "rotate-180" : ""} />
          </Button>
        </div>
        {selectedVisible.length > 0 && (
          <div className="flex items-center gap-2.5 px-3">
            <Button variant="outline" size="icon" aria-label="Duplicate selected" onClick={() => void duplicate(selectedVisible)}>
              <CopyIcon />
            </Button>
            <Button
              variant="destructive-outline"
              size="icon"
              aria-label="Delete selected"
              onClick={() => setDialog({ type: "delete", projects: visible.filter((p) => selectedVisible.includes(p.id)) })}
            >
              <TrashIcon />
            </Button>
          </div>
        )}
      </div>

      <main className="px-8 pb-10 pt-2">
        {projects === null ? (
          <Skeleton />
        ) : visible.length === 0 ? (
          <EmptyState hasProjects={projects.length > 0} query={query} onClear={() => setQuery("")} onCreate={createProject} />
        ) : (
          <div className={prefs.viewMode === "grid" ? "grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col"}>
            {visible.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                grid={prefs.viewMode === "grid"}
                selected={selected.includes(project.id)}
                showMenu={!multi}
                onToggle={(event) => toggleSelect(project.id, event)}
                onMenu={(anchor) => setMenu({ anchor, items: menuFor(project) })}
              />
            ))}
          </div>
        )}
      </main>

      <PopupMenu anchor={menu?.anchor ?? null} items={menu?.items ?? []} onClose={() => setMenu(null)} />
      <PopupMenu
        anchor={sortMenu}
        onClose={() => setSortMenu(null)}
        items={(Object.keys(SORT_LABELS) as ProjectSortKey[]).map((key) => ({
          label: `${prefs.sortKey === key ? "✓ " : ""}${SORT_LABELS[key]}`,
          icon: null,
          onSelect: () => update({ sortKey: key }),
        }))}
      />

      <RenameDialog
        project={dialog?.type === "rename" ? dialog.project : null}
        onClose={() => setDialog(null)}
        onConfirm={(name) => {
          const target = dialog?.type === "rename" ? dialog.project : null;
          setDialog(null);
          if (target) void run(() => renameProject(getRepositories(), target.id, name), "Failed to rename project");
        }}
      />
      <DeleteDialog
        projects={dialog?.type === "delete" ? dialog.projects : null}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          const targets = dialog?.type === "delete" ? dialog.projects : [];
          setDialog(null);
          void run(async () => {
            await deleteProjects(getRepositories(), targets.map((p) => p.id));
            setSelected((current) => current.filter((id) => !targets.some((p) => p.id === id)));
          }, "Failed to delete projects");
        }}
      />
      <InfoDialog project={dialog?.type === "info" ? dialog.project : null} onClose={() => setDialog(null)} />

      {toast && (
        <div role="alert" className="fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Thumbnail({ project, size }: { project: ProjectSummary; size: "card" | "row" }) {
  return project.thumbnail ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={project.thumbnail} alt="Project thumbnail" className="size-full object-cover" />
  ) : (
    <div className="flex size-full items-center justify-center text-zinc-500">
      <VideoIcon width={size === "card" ? 48 : 20} height={size === "card" ? 48 : 20} />
    </div>
  );
}

function ProjectItem({
  project,
  grid,
  selected,
  showMenu,
  onToggle,
  onMenu,
}: {
  project: ProjectSummary;
  grid: boolean;
  selected: boolean;
  showMenu: boolean;
  onToggle: (event: MouseEvent) => void;
  onMenu: (anchor: MenuAnchor) => void;
}) {
  const href = `/editor/${encodeURIComponent(project.id)}`;
  const duration = formatDuration(project.duration);
  const menuButton = (className: string) =>
    showMenu && (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Project menu"
        className={className}
        onClick={(event) => {
          event.preventDefault();
          onMenu(anchorBelow(event.currentTarget));
        }}
      >
        <MoreIcon />
      </Button>
    );
  return (
    <div
      className="group relative"
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      {grid ? (
        <>
          <Link href={href} className="block overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="relative aspect-video bg-zinc-100">
              <div className="absolute inset-0">
                <Thumbnail project={project} size="card" />
              </div>
              <div className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-2 py-1 text-xs font-semibold text-white">{duration}</div>
            </div>
            <div className="flex flex-col gap-2 p-3">
              <h3 className="line-clamp-2 text-sm font-medium leading-snug">{project.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <CalendarIcon />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
          </Link>
          <div className={cx("absolute left-3 top-3 z-10", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
            <Checkbox label={`Select ${project.name}`} checked={selected} onToggle={onToggle} />
          </div>
          {menuButton("absolute right-3 top-3 z-10 bg-white opacity-0 shadow-sm group-hover:opacity-100 focus-visible:opacity-100")}
        </>
      ) : (
        <div className={cx("flex items-center gap-4 border-b border-zinc-100 px-4 py-2", selected && "bg-zinc-50")}>
          <Checkbox label={`Select ${project.name}`} checked={selected} onToggle={onToggle} />
          <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded bg-zinc-100">
              <Thumbnail project={project} size="row" />
            </div>
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</h3>
            <span className="hidden shrink-0 text-sm text-zinc-500 sm:block">{duration}</span>
            <span className="hidden shrink-0 pl-8 text-right text-sm text-zinc-500 sm:block">{formatDate(project.createdAt)}</span>
          </Link>
          {menuButton("")}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" aria-busy>
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-zinc-100">
          <div className="aspect-video bg-zinc-100" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-3/4 rounded bg-zinc-100" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasProjects,
  query,
  onClear,
  onCreate,
}: {
  hasProjects: boolean;
  query: string;
  onClear: () => void;
  onCreate: () => void;
}) {
  return hasProjects ? (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-zinc-500">
        <SearchIcon width={32} height={32} />
      </div>
      <h3 className="text-lg font-medium">No results found</h3>
      <p className="max-w-md text-zinc-500">Your search for &quot;{query}&quot; did not return any results.</p>
      <Button variant="outline" size="lg" onClick={onClear}>
        Clear search
      </Button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <VideoIcon width={32} height={32} />
      </div>
      <h3 className="text-lg font-medium">No projects yet</h3>
      <p className="max-w-md text-zinc-500">Start creating your first project. Import media, edit, and export your videos. All privately.</p>
      <Button size="lg" onClick={onCreate}>
        <PlusIcon />
        Create your first project
      </Button>
    </div>
  );
}

function RenameDialog({ project, onClose, onConfirm }: { project: ProjectSummary | null; onClose: () => void; onConfirm: (name: string) => void }) {
  const [name, setName] = useState("");
  useEffect(() => setName(project?.name ?? ""), [project]);
  return (
    <Dialog
      open={!!project}
      onClose={onClose}
      title="Rename project"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => onConfirm(name)}>Rename</Button>
        </>
      }
    >
      <label className="text-xs font-semibold text-zinc-500" htmlFor="rename-input">New name</label>
      <TextInput
        id="rename-input"
        autoFocus
        value={name}
        placeholder="Enter a new name"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && name.trim()) onConfirm(name);
        }}
      />
    </Dialog>
  );
}

function DeleteDialog({ projects, onClose, onConfirm }: { projects: ProjectSummary[] | null; onClose: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [projects]);
  const single = projects?.length === 1 ? projects[0].name : null;
  return (
    <Dialog
      open={!!projects}
      onClose={onClose}
      title={single ? `Delete '${single}'?` : `Delete ${projects?.length ?? 0} projects?`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={typed !== "DELETE"} onClick={onConfirm}>Delete</Button>
        </>
      }
    >
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
        <p className="font-medium">Warning</p>
        <p>This will permanently delete {single ? `"${single}"` : `${projects?.length ?? 0} projects`} and all associated files.</p>
      </div>
      <label className="text-xs font-semibold text-zinc-500" htmlFor="delete-input">Type &quot;DELETE&quot; to confirm</label>
      <TextInput id="delete-input" placeholder="DELETE" value={typed} onChange={(event) => setTyped(event.target.value)} />
    </Dialog>
  );
}

function InfoDialog({ project, onClose }: { project: ProjectSummary | null; onClose: () => void }) {
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
  return (
    <Dialog open={!!project} onClose={onClose} title={<span className="block max-w-[22rem] truncate">{project?.name}</span>} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      {project && (
        <>
          {row("Duration", formatDuration(project.duration))}
          {row("Created", formatDate(project.createdAt))}
          {row("Modified", formatDate(project.updatedAt))}
          {row("Project ID", <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{project.id.slice(0, 8)}</code>)}
        </>
      )}
    </Dialog>
  );
}
