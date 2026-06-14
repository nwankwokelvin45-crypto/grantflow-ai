"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Building2, Users,
  FolderOpen, Settings, LogOut, ChevronDown, Menu, X, Bell, ShieldCheck, BarChart2,
  ClipboardList, GitBranch, Star, TrendingUp, Globe, Zap, BookOpen,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const nav = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/grants",       label: "Grants",      icon: FileText },
  { href: "/opportunities",label: "Discovery",   icon: Bell },
  { href: "/workflows",    label: "Workflows",   icon: GitBranch },
  { href: "/forms",        label: "Forms",       icon: ClipboardList },
  { href: "/reviews",      label: "Reviews",     icon: Star },
  { href: "/portal",       label: "Portal",      icon: Globe },
  { href: "/analytics",    label: "Analytics",   icon: TrendingUp },
  { href: "/funders",      label: "Funders",     icon: Building2 },
  { href: "/requirements", label: "Requirements", icon: BookOpen },
  { href: "/financials",   label: "Financials",  icon: BarChart2 },
  { href: "/documents",    label: "Documents",   icon: FolderOpen },
  { href: "/team",         label: "Team",        icon: Users },
  { href: "/pricing",      label: "Pricing",     icon: Zap },
  { href: "/settings",     label: "Settings",    icon: Settings },
];

interface SidebarProps { orgName?: string; isAdmin?: boolean; }

function SidebarContent({ orgName, isAdmin, onClose }: { orgName?: string; isAdmin?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex h-full flex-col sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: "var(--sidebar-border) 1px solid" }}>
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="Grant2Fund'n" width={32} height={32} className="rounded-lg" />
          <span className="font-serif font-semibold text-lg" style={{ color: "#FFFFFF" }}>Grant2Fund'n</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.5)" }} className="hover:text-white md:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Org */}
      {orgName && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            <span className="truncate font-medium">{orgName}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
              style={active
                ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active)", borderLeft: "2px solid var(--sidebar-active)" }
                : { color: "var(--sidebar-text)", borderLeft: "2px solid transparent" }}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (() => {
          const active = pathname === "/admin" || pathname.startsWith("/admin/");
          return (
            <Link href="/admin" onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium mt-2"
              style={active
                ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active)", borderLeft: "2px solid var(--sidebar-active)" }
                : { color: "rgba(255,255,255,0.3)", borderLeft: "2px solid transparent" }}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin
            </Link>
          );
        })()}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={handleSignOut} disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.38)" }}>
          <LogOut className="h-4 w-4 shrink-0" />
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ orgName, isAdmin }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger bar */}
      <div className="flex items-center justify-between h-14 px-4 md:hidden"
        style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 40 }}>
        <div className="flex items-center gap-2">
          <Image src="/icon.png" alt="Grant2Fund'n" width={28} height={28} className="rounded-lg" />
          <span className="font-serif font-semibold text-base text-white">Grant2Fund'n</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent orgName={orgName} isAdmin={isAdmin} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:h-full">
        <SidebarContent orgName={orgName} isAdmin={isAdmin} />
      </div>
    </>
  );
}
