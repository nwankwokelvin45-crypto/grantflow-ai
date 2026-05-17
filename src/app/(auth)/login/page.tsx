"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14" style={{ background: "linear-gradient(160deg, var(--navy) 0%, var(--navy-light) 100%)" }}>
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/icon.png" alt="Grant2Fund'n" width={36} height={36} className="rounded-lg" />
          <span className="font-serif font-semibold text-xl text-white">Grant2Fund'n</span>
        </Link>
        <div>
          <blockquote className="font-serif text-2xl font-medium text-white leading-relaxed mb-6">
            "The AI-powered platform that helps BC & Alberta nonprofits write grants that get funded."
          </blockquote>
          <div className="flex flex-wrap gap-2">
            {["Vancouver Foundation", "BC Arts Council", "Calgary Foundation", "Alberta Foundation for the Arts"].map((f) => (
              <span key={f} className="text-xs rounded-full px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>{f}</span>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Grant2Fund'n</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-9">
            <Link href="/" className="inline-block lg:hidden mb-5">
              <Image src="/icon.png" alt="Grant2Fund'n" width={48} height={48} className="rounded-xl mx-auto hover:opacity-80 transition-opacity" />
            </Link>
            <h1 className="font-serif font-bold text-3xl mb-1.5" style={{ color: "var(--navy)" }}>Welcome back</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sign in to your Grant2Fund'n account</p>
          </div>

          <div className="rounded-2xl border p-7 shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
            {/* Google OAuth */}
            <button type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 rounded-lg border py-2.5 text-sm font-medium transition-all hover:shadow-sm mb-4"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm border" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  placeholder="you@organization.org"
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--navy)" }}>Password</label>
                  <Link href="/forgot-password" className="text-xs font-medium" style={{ color: "var(--gold)" }}>Forgot password?</Link>
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                    style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                    placeholder="••••••••"
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
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "var(--gold)" }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
