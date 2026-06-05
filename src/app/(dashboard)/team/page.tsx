"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import TopNav from "@/components/layout/TopNav";
import { Users, Mail, Shield, UserPlus, Copy, Check, Clock, Trash2, MessageSquare, Hash, Send, ChevronRight } from "lucide-react";

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

interface Grant {
  id: string;
  title: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  grantId: string | null;
  sender: { id: string; name: string | null; email: string };
}

type Tab = "members" | "messages";

function Avatar({ name, email, size = 9 }: { name: string | null; email: string; size?: number }) {
  const letter = (name?.[0] ?? email[0]).toUpperCase();
  const colors = ["#2A3F6B", "#1B6B4B", "#6B2A3F", "#4B3F6B", "#6B5A2A"];
  const color = colors[(name ?? email).charCodeAt(0) % colors.length];
  return (
    <div className={`h-${size} w-${size} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: color, fontSize: size <= 8 ? 12 : 14, minWidth: size * 4, minHeight: size * 4 }}>
      {letter}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TeamPage() {
  const [tab, setTab] = useState<Tab>("members");
  // Members tab state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newInviteUrl, setNewInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [orgId, setOrgId] = useState("");
  // Messages tab state
  const [grants, setGrants] = useState<Grant[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null); // null = general
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then((orgs) => {
      if (orgs.length > 0) {
        const id = orgs[0].id;
        setOrgId(id);
        fetch(`/api/organizations/${id}/invites`).then((r) => r.json()).then(setInvites);
        fetch(`/api/organizations/${id}/members`).then((r) => r.json()).then((ms: Member[]) => {
          setMembers(ms);
        });
      }
    });
    fetch("/api/grants").then((r) => r.json()).then((data) => {
      setGrants(Array.isArray(data) ? data : data.grants ?? []);
    });
    fetch("/api/auth/session").then((r) => r.json()).then((s) => {
      if (s?.user?.id) setCurrentUserId(s.user.id);
    });
  }, []);

  // Load messages + poll
  useEffect(() => {
    loadMessages();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  async function loadMessages() {
    const url = activeChannel ? `/api/messages?grantId=${activeChannel}` : "/api/messages";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleInvite(e: FormEvent) {
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
    if (!res.ok) { setError(data.error || "Failed to create invite"); return; }
    setNewInviteUrl(data.inviteUrl);
    setInvites((prev) => [data, ...prev]);
    setEmail("");
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msgInput.trim(), grantId: activeChannel ?? undefined }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setMsgInput("");
    }
    setSendingMsg(false);
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeChannelName = activeChannel
    ? grants.find((g) => g.id === activeChannel)?.title ?? "Project"
    : "General";

  return (
    <div>
      <TopNav title="Team" subtitle="Manage your organization's members and collaboration" />

      {/* Tab bar */}
      <div className="px-6 pt-4 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([["members", Users, "Members"], ["messages", MessageSquare, "Messages"]] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
            style={tab === key
              ? { color: "var(--accent)", borderBottom: "2px solid var(--accent)", background: "var(--accent-subtle)" }
              : { color: "var(--text-muted)" }}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="p-6 max-w-4xl mx-auto">
          {/* Roles */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "Owner", desc: "Full access — manage billing, team, and all grants", bg: "rgba(196,151,74,0.08)", color: "var(--gold)", border: "rgba(196,151,74,0.3)" },
              { role: "Editor", desc: "Create and edit grants, run AI and compliance checks", bg: "rgba(74,124,196,0.08)", color: "#4A7CC4", border: "rgba(74,124,196,0.3)" },
              { role: "Viewer", desc: "Read-only access to grants and funder database", bg: "var(--bg-subtle)", color: "var(--text-muted)", border: "var(--border)" },
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
          <div className="mb-6 rounded-xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Mail className="h-4 w-4" style={{ color: "var(--accent)" }} />
              Invite a team member
            </h3>
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="colleague@organization.org"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none min-w-48"
                style={{ border: "1.5px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button type="submit" disabled={sending}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, var(--navy-light, #2A3F6B), var(--navy, #1B2B4B))", opacity: sending ? 0.7 : 1 }}>
                <UserPlus className="h-4 w-4" />
                {sending ? "Sending..." : "Send Invite"}
              </button>
            </form>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {newInviteUrl && (
              <div className="mt-4 rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)" }}>
                <p className="text-xs flex-1 truncate font-mono" style={{ color: "var(--text-primary)" }}>{newInviteUrl}</p>
                <button onClick={() => copyLink(newInviteUrl)}
                  className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ background: "var(--accent)" }}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            )}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="mb-6 rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
                <Clock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Pending Invites</span>
              </div>
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{inv.email}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {inv.role.toLowerCase()} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {inv.inviteUrl && (
                      <button onClick={() => copyLink(inv.inviteUrl!)}
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{ color: "var(--accent)", background: "var(--accent-subtle)" }}>
                        Copy link
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Members list */}
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Members</span>
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
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Invite colleagues above to collaborate.</p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {members.map((m) => (
                  <li key={m.user.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.user.name} email={m.user.email} size={9} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.user.name ?? m.user.email}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: m.memberRole === "OWNER" ? "rgba(196,151,74,0.12)" : m.memberRole === "ADMIN" ? "rgba(74,124,196,0.12)" : "var(--bg-subtle)",
                          color: m.memberRole === "OWNER" ? "var(--gold, #C4974A)" : m.memberRole === "ADMIN" ? "#4A7CC4" : "var(--text-muted)",
                        }}>
                        {m.memberRole.toLowerCase()}
                      </span>
                      {m.memberRole !== "OWNER" && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Remove ${m.user.name ?? m.user.email}?`)) return;
                            await fetch(`/api/organizations/${orgId}/members`, {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: m.user.id }),
                            });
                            setMembers((prev) => prev.filter((x) => x.user.id !== m.user.id));
                          }}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
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
      )}

      {/* ── MESSAGES TAB ── */}
      {tab === "messages" && (
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
          {/* Channels sidebar */}
          <div className="w-56 shrink-0 border-r flex flex-col" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Channels</p>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {/* General */}
              <button
                onClick={() => setActiveChannel(null)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors"
                style={activeChannel === null
                  ? { background: "var(--accent-subtle)", color: "var(--accent)" }
                  : { color: "var(--text-secondary)" }}>
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">General</span>
              </button>
              {/* Grant channels */}
              {grants.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider px-3 pt-3 pb-1" style={{ color: "var(--text-muted)" }}>Projects</p>
                  {grants.map((g) => (
                    <button key={g.id}
                      onClick={() => setActiveChannel(g.id)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors"
                      style={activeChannel === g.id
                        ? { background: "var(--accent-subtle)", color: "var(--accent)" }
                        : { color: "var(--text-secondary)" }}>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{g.title}</span>
                    </button>
                  ))}
                </>
              )}
            </nav>
            {/* Members online */}
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Team</p>
              {members.slice(0, 5).map((m) => (
                <div key={m.user.id} className="flex items-center gap-2 py-1">
                  <div className="relative">
                    <Avatar name={m.user.name} email={m.user.email} size={6} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white"
                      style={{ background: "#22C55E" }} />
                  </div>
                  <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                    {m.user.name ?? m.user.email.split("@")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Channel header */}
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
              {activeChannel ? <ChevronRight className="h-4 w-4" style={{ color: "var(--accent)" }} /> : <Hash className="h-4 w-4" style={{ color: "var(--accent)" }} />}
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{activeChannelName}</span>
              {activeChannel && (
                <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>
                  {grants.find((g) => g.id === activeChannel)?.status?.toLowerCase()}
                </span>
              )}
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 mb-3" style={{ color: "var(--border)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No messages yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Start the conversation with your team.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender.id === currentUserId;
                  const showAvatar = i === 0 || messages[i - 1].sender.id !== msg.sender.id;
                  return (
                    <div key={msg.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      {showAvatar
                        ? <Avatar name={msg.sender.name} email={msg.sender.email} size={8} />
                        : <div className="w-8 shrink-0" />}
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                              {msg.sender.name ?? msg.sender.email.split("@")[0]}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className="rounded-2xl px-4 py-2.5 text-sm"
                          style={isMe
                            ? { background: "var(--accent)", color: "#fff" }
                            : { background: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-5 py-3 border-t flex gap-3 items-center" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder={`Message #${activeChannelName.toLowerCase()}`}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as FormEvent); } }}
              />
              <button type="submit" disabled={!msgInput.trim() || sendingMsg}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white transition-opacity"
                style={{ background: "var(--accent)", opacity: !msgInput.trim() || sendingMsg ? 0.5 : 1 }}>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
