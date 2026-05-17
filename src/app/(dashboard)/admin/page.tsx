import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopNav from "@/components/layout/TopNav";
import { Users, Building2, FileText, DollarSign, TrendingUp, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "SUPER_ADMIN" && user?.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers, totalOrgs, totalGrants, totalFunders,
    recentUsers, recentGrants, tierCounts, statusCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.grant.count(),
    prisma.funder.count({ where: { isActive: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.grant.findMany({
      orderBy: { createdAt: "desc" }, take: 10,
      select: { id: true, title: true, status: true, createdAt: true, organization: { select: { name: true } } },
    }),
    prisma.organization.groupBy({ by: ["currentTier"], _count: true }),
    prisma.grant.groupBy({ by: ["status"], _count: true }),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "#4A7CC4" },
    { label: "Organizations", value: totalOrgs, icon: Building2, color: "var(--gold)" },
    { label: "Grants Created", value: totalGrants, icon: FileText, color: "#2EAD6B" },
    { label: "Active Funders", value: totalFunders, icon: TrendingUp, color: "#7C3AED" },
  ];

  return (
    <div className="animate-fade-in">
      <TopNav title="Admin Panel" subtitle="Platform overview and management" />
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier breakdown */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Subscription Tiers</h2>
            </div>
            <div className="space-y-2">
              {tierCounts.map((t) => (
                <div key={t.currentTier} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{t.currentTier}</span>
                  <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--warm-gray)", color: "var(--text-muted)" }}>{t._count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grant status breakdown */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Grant Statuses</h2>
            </div>
            <div className="space-y-2">
              {statusCounts.map((s) => (
                <div key={s.status} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-medium capitalize" style={{ color: "var(--text)" }}>{s.status.toLowerCase().replace("_", " ")}</span>
                  <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--warm-gray)", color: "var(--text-muted)" }}>{s._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent users */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent Signups</h2>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{u.name ?? "—"}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-CA")}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent grants */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>Recent Grants</h2>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentGrants.map((g) => (
                <li key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]" style={{ color: "var(--text)" }}>{g.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{g.organization.name}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                    style={{ background: g.status === "AWARDED" ? "rgba(46,173,107,0.1)" : "var(--warm-gray)", color: g.status === "AWARDED" ? "#2EAD6B" : "var(--text-muted)" }}>
                    {g.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
