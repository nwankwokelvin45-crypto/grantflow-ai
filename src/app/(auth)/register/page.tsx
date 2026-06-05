"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      router.push("/login");
    } else {
      router.push(invite ? `/invite/${invite}` : "/organization/new");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14" style={{ background: "linear-gradient(160deg, var(--navy) 0%, var(--navy-light) 100%)" }}>
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Grant2Fund'n" width={36} height={36} className="rounded-lg" />
          <span className="font-serif font-semibold text-xl text-white">Grant2Fund'n</span>
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white leading-snug mb-6">
            Start writing grants that get funded.
          </h2>
          <ul className="space-y-3">
            {[
              "AI writing tailored to each funder's priorities",
              "Real-time compliance scoring 0–100",
              "75+ real BC & Alberta funders built in",
              "Export to PDF, Word, or plain text",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--gold)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Grant2Fund'n</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-9">
            <Image src="/icon.png" alt="Grant2Fund'n" width={48} height={48} className="rounded-xl mb-5 lg:hidden mx-auto" />
            <h1 className="font-serif font-bold text-3xl mb-1.5" style={{ color: "var(--navy)" }}>Create your account</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Free to start — no credit card required</p>
          </div>

          <div className="rounded-2xl border p-7 shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: invite ? `/invite/${invite}` : "/organization/new" })}
              className="w-full flex items-center justify-center gap-3 rounded-lg border py-2.5 text-sm font-medium transition-all hover:bg-gray-50 mb-4"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--border)" }} /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 text-xs" style={{ background: "white", color: "var(--text-muted)" }}>or</span></div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm border" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  placeholder="Your name"
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Work Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  placeholder="you@organization.org"
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                    placeholder="Min. 8 characters"
                    onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all mt-2"
                style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "var(--gold)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
