"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // If token present, hit the verify API via redirect — handled server-side
  // This page is shown when: no token (check inbox), or error (expired/missing)

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSending(false);
    setSent(true);
  }

  const isError = !!error;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block mb-8">
          <Image src="/icon.png" alt="Grant2Fund'n" width={48} height={48} className="rounded-xl mx-auto" />
        </Link>

        {isError ? (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>
              {error === "expired" ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              {error === "expired"
                ? "Your verification link has expired. Enter your email below to get a new one."
                : "This verification link is not valid. Request a fresh one below."}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📬</div>
            <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>
              Check your inbox
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              We sent you a verification link. Click it to activate your account.
              It expires in 24 hours.
            </p>
          </>
        )}

        <div className="rounded-2xl border p-6 text-left" style={{ background: "white", borderColor: "var(--border)" }}>
          {sent ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Email sent!</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Check your inbox (and spam folder).</p>
            </div>
          ) : (
            <form onSubmit={resend} className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Resend verification email
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@organization.org"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--navy-light, #2A3F6B), var(--navy, #1B2B4B))", opacity: sending ? 0.7 : 1 }}>
                {sending ? "Sending..." : "Resend verification email"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Already verified?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--gold)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
