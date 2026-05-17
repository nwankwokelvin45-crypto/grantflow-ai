import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--cream)" }}>
      <div className="text-center">
        <p className="text-8xl font-serif font-bold mb-4" style={{ color: "var(--navy)", opacity: 0.15 }}>404</p>
        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>Page not found</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
