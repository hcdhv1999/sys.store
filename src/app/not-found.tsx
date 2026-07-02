import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-accent-foreground">
        ح
      </span>
      <p className="text-5xl font-bold tracking-tight text-ink tabular-nums">404</p>
      <p className="max-w-sm text-sm leading-relaxed text-ink-2">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        <br />
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        العودة للوحة التحكم · Back to dashboard
      </Link>
    </div>
  );
}
