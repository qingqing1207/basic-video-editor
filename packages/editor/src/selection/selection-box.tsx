"use client";

import type { SelectionBoxBounds } from "@/selection/types";

interface SelectionBoxProps {
  bounds: SelectionBoxBounds | null;
}

export function SelectionBox({ bounds }: SelectionBoxProps) {
  if (!bounds) return null;

  return (
    <div
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
      className="bve-selection-box pointer-events-none absolute z-raised border"
    />
  );
}
