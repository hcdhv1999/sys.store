import { cn } from "@/lib/utils";

export function BrandMark({ large = false, dark = false }: { large?: boolean; dark?: boolean }) {
  return (
    <div className="relative flex items-center gap-3">
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl bg-accent font-bold text-accent-foreground",
          large ? "h-12 w-12 text-2xl" : "h-9 w-9 text-lg",
        )}
      >
        ح
      </span>
      <span className={cn("font-bold tracking-tight", large ? "text-2xl" : "text-lg", dark ? "text-ink" : "text-white")}>
        حِرف <span className={cn("font-semibold", dark ? "text-ink-3" : "text-white/50", large ? "text-lg" : "text-sm")}>HIRF</span>
      </span>
    </div>
  );
}
