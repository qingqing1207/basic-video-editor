export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex h-dvh w-full items-center justify-center bg-white">
      <svg viewBox="0 0 24 24" width={32} height={32} fill="none" className="animate-spin text-zinc-900" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  );
}
