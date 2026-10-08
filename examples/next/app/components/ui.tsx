"use client";
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from "react";

/* Host-owned UI kit. Plain Tailwind, independent of the editor's design tokens. */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Icon({ shape, ...props }: { shape: ReactNode } & Omit<SVGProps<SVGSVGElement>, "path">) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {shape}
    </svg>
  );
}
export const GridIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>} />;
export const ListIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>} />;
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>} />;
export const MoreIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />} />;
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<path d="M12 5v14M5 12h14" />} />;
export const CopyIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>} />;
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>} />;
export const EditIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>} />;
export const InfoIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>} />;
export const VideoIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>} />;
export const ArrowDownIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<path d="M12 5v14m-6-6 6 6 6-6" />} />;
export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p} shape={<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>} />;

const buttonBase = "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";
const buttonVariants = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "text-zinc-900 hover:bg-zinc-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  "destructive-outline": "border border-zinc-200 bg-white text-red-600 hover:bg-red-50",
};
const buttonSizes = { md: "h-9 px-4", lg: "h-10 px-5", icon: "size-9" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}) {
  return <button type="button" className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />;
}

export function Checkbox({
  checked,
  onToggle,
  label,
  className,
}: {
  checked: boolean | "indeterminate";
  onToggle: (event: MouseEvent<HTMLInputElement>) => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === "indeterminate";
  }, [checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked === true}
      onChange={() => {}}
      onClick={onToggle}
      className={cx("size-5 shrink-0 cursor-pointer accent-zinc-900", className)}
    />
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900",
        props.className,
      )}
    />
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 p-0 shadow-xl backdrop:bg-black/30"
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex flex-col gap-3 text-sm">{children}</div>
          <div className="flex justify-end gap-2 pt-2">{footer}</div>
        </div>
      )}
    </dialog>
  );
}

export type MenuEntry =
  | "separator"
  | { label: string; icon: ReactNode; onSelect: () => void; destructive?: boolean };

export interface MenuAnchor {
  x: number;
  y: number;
  align?: "left" | "right";
}

export function anchorBelow(element: HTMLElement): MenuAnchor {
  const rect = element.getBoundingClientRect();
  return { x: rect.right, y: rect.bottom + 4, align: "right" };
}

export function PopupMenu({
  anchor,
  items,
  onClose,
}: {
  anchor: MenuAnchor | null;
  items: MenuEntry[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!anchor) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && ref.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor, onClose]);
  if (!anchor) return null;
  const style =
    anchor.align === "right"
      ? { top: anchor.y, right: Math.max(8, window.innerWidth - anchor.x) }
      : { top: anchor.y, left: Math.min(anchor.x, window.innerWidth - 200) };
  return (
    <div ref={ref} role="menu" style={style} className="fixed z-50 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
      {items.map((item, index) =>
        item === "separator" ? (
          <div key={index} className="my-1 h-px bg-zinc-200" />
        ) : (
          <button
            key={item.label}
            role="menuitem"
            type="button"
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={cx(
              "flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-zinc-100",
              item.destructive && "text-red-600 hover:bg-red-50",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
