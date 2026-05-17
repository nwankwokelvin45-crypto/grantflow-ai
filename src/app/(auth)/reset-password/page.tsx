"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      const d = await res.json();
      setError(d.error ?? "Something went wrong");
    }
  }

  return (
    <div className="rounded-xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
      {done ? (
        <div className="text-center py-4">
          <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Password updated!</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Redirecting to sign in...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>New Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                placeholder="••••••••"
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                placeholder="••••••••"
                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="Grant2Fund'n" width={48} height={48} className="rounded-xl mx-auto mb-4" />
          <h1 className="font-serif font-bold text-2xl" style={{ color: "var(--navy)" }}>Set new password</h1>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          <Link href="/login" className="font-semibold" style={{ color: "var(--gold)" }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
