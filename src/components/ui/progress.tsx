import { cn, clamp } from "@/lib/utils";

export function Progress({ value, className, tone }: { value: number; className?: string; tone?: "auto" | "accent" }) {
  const v = clamp(value, 0, 100);
  const color =
    tone === "accent"
      ? "var(--accent)"
      : v >= 80
        ? "var(--success)"
        : v >= 40
          ? "var(--accent)"
          : "var(--info)";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, backgroundColor: color }} />
    </div>
  );
}
