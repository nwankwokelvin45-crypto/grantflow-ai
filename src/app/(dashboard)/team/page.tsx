"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Users, Mail, Shield, UserPlus, Copy, Check, Clock, Trash2 } from "lucide-react";

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  inviteUrl?: string;
}

interface Member {
  memberRole: string;
  joinedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export default function TeamPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newInviteUrl, setNewInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [orgId, setOrgId] = useState("");

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then((orgs) => {
      if (orgs.length > 0) {
        const id = orgs[0].id;
        setOrgId(id);
        fetch(`/api/organizations/${id}/invites`).then((r) => r.json()).then(setInvites);
        fetch(`/api/organizations/${id}/members`).then((r) => r.json()).then(setMembers);
      }
    });
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSending(true);
    setError("");
    setNewInviteUrl("");

    const res = await fetch(`/api/organizations/${orgId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "Failed to create invite");
      return;
    }

    setNewInviteUrl(data.inviteUrl);
    setInvites((prev) => [data, ...prev]);
    setEmail("");
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <TopNav title="Team" subtitle="Manage your organization's members and permissions" />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Roles */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: "Owner", desc: "Full access — manage billing, team, and all grants", bg: "rgba(196,151,74,0.08)", color: "var(--gold)", border: "rgba(196,151,74,0.3)" },
            { role: "Editor", desc: "Create and edit grants, run AI and compliance checks", bg: "rgba(74,124,196,0.08)", color: "#4A7CC4", border: "rgba(74,124,196,0.3)" },
            { role: "Viewer", desc: "Read-only access to grants and funder database", bg: "var(--warm-gray)", color: "var(--text-muted)", border: "var(--border)" },
          ].map((r) => (
            <div key={r.role} className="rounded-xl border p-4" style={{ background: r.bg, borderColor: r.border }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4" style={{ color: r.color }} />
                <span className="text-sm font-bold" style={{ color: r.color }}>{r.role}</span>
              </div>
              <p className="text-xs" style={{ color: r.color, opacity: 0.8 }}>{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Invite form */}
        <div className="mb-6 rounded-xl border p-5" style={{ background: "white", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--navy)" }}>
            <Mail className="h-4 w-4" style={{ color: "var(--gold)" }} />
            Invite a team member
          </h3>
          <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="colleague@organization.org"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none min-w-48"
              style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "var(--cream)", color: "var(--navy)" }}>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button type="submit" disabled={sending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: sending ? 0.7 : 1 }}>
              <UserPlus className="h-4 w-4" />
              {sending ? "Sending..." : "Send Invite"}
            </button>
          </form>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

          {/* Invite link */}
          {newInviteUrl && (
            <div className="mt-4 rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(196,151,74,0.08)", border: "1px solid rgba(196,151,74,0.3)" }}>
              <p className="text-xs flex-1 truncate font-mono" style={{ color: "var(--navy)" }}>{newInviteUrl}</p>
              <button onClick={() => copyLink(newInviteUrl)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold"
                style={{ background: "var(--gold)", color: "white" }}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mb-6 rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
              <Clock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Pending Invites</span>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--warm-gray)" }}>
              {invites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{inv.email}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {inv.role.toLowerCase()} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  {inv.inviteUrl && (
                    <button onClick={() => copyLink(inv.inviteUrl!)}
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ color: "var(--gold)", background: "rgba(196,151,74,0.08)" }}>
                      Copy link
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Members */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Members</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>
              {members.length}
            </span>
          </div>
          {members.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--border)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Just you for now</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Invite colleagues to collaborate on grant writing and review.
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {members.map((m) => (
                <li key={m.user.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--navy-light, #2A3F6B), var(--navy, #1B2B4B))" }}>
                      {m.user.name?.[0]?.toUpperCase() ?? m.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: m.memberRole === "OWNER" ? "rgba(196,151,74,0.12)" : m.memberRole === "ADMIN" ? "rgba(74,124,196,0.12)" : "var(--warm-gray, #F5F3EF)",
                        color: m.memberRole === "OWNER" ? "var(--gold)" : m.memberRole === "ADMIN" ? "#4A7CC4" : "var(--text-muted)",
                      }}>
                      {m.memberRole.toLowerCase()}
                    </span>
                    {m.memberRole !== "OWNER" && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Remove ${m.user.name ?? m.user.email} from the team?`)) return;
                          await fetch(`/api/organizations/${orgId}/members`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: m.user.id }),
                          });
                          setMembers((prev) => prev.filter((x) => x.user.id !== m.user.id));
                        }}
                        className="text-xs p-1.5 rounded hover:bg-red-50 transition-colors"
                        style={{ color: "var(--text-muted)" }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
