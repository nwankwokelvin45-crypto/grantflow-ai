"use client";

import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface TopNavProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopNav({ title, subtitle, actions }: TopNavProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex min-h-14 items-center justify-between gap-3 px-4 md:px-7 py-3 topnav-glass"
      style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 30 }}>
      <div className="min-w-0 flex-1">
        <h1 className="font-serif font-semibold text-base md:text-lg leading-tight truncate" style={{ color: "var(--text)" }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseOver={(e) => { e.currentTarget.style.background = "var(--sky-pale)"; e.currentTarget.style.color = "var(--sky)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="rounded-lg p-2 transition-colors hidden sm:block" style={{ color: "var(--text-muted)" }}
          onMouseOver={(e) => { e.currentTarget.style.background = "var(--sky-pale)"; e.currentTarget.style.color = "var(--sky)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
