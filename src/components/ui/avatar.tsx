"use client";

import { cn, hashIndex, initials } from "@/lib/utils";

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const color = palette[hashIndex(name, palette.length)];
  const sizes = { sm: "h-6 w-6 text-[9px]", md: "h-8 w-8 text-[10px]", lg: "h-12 w-12 text-sm" };
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="flex items-center -space-x-2 rtl:space-x-reverse">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="sm" className="ring-2 ring-surface" />
      ))}
      {extra > 0 ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[9px] font-bold text-ink-2 ring-2 ring-surface">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
