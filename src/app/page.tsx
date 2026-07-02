import Link from "next/link";

// The edge middleware routes "/" before this renders (session → /dashboard,
// otherwise → /login); this static fallback only shows if middleware is
// bypassed, e.g. when the file is opened directly from a static preview.
export default function RootPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Link
        href="/dashboard"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        الدخول إلى حِرف · Open HIRF
      </Link>
    </div>
  );
}
