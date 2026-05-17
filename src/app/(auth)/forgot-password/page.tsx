"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="Grant2Fund'n" width={48} height={48} className="rounded-xl mx-auto mb-4" />
          <h1 className="font-serif font-bold text-2xl" style={{ color: "var(--navy)" }}>Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full" style={{ background: "rgba(46,173,107,0.1)" }}>
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Check your email</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  placeholder="you@organization.org"
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Remember your password?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--gold)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
