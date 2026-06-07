"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Building2, Bell, Shield, CreditCard, Check, Zap } from "lucide-react";

const PROVINCES = [
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "ON", label: "Ontario" },
  { value: "SK", label: "Saskatchewan" },
  { value: "MB", label: "Manitoba" },
  { value: "OTHER", label: "Other" },
];

const FOCUS_AREAS = [
  "ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SOCIAL_SERVICES", "EDUCATION",
  "INDIGENOUS", "SPORT_RECREATION", "ECONOMIC_DEVELOPMENT", "HOUSING",
  "FOOD_SECURITY", "SENIORS", "YOUTH", "DISABILITY", "IMMIGRATION",
  "LGBTQ", "ANIMAL_WELFARE", "OTHER",
];

function focusLabel(key: string) {
  return key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function InputField({
  label, value, onChange, type = "text", placeholder, as,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; as?: "textarea";
}) {
  const shared = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none",
    style: { border: "1.5px solid var(--border)", background: "var(--cream)" },
    placeholder,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--gold)"),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "var(--border)"),
  };
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>{label}</label>
      {as === "textarea"
        ? <textarea rows={3} {...shared} />
        : <input type={type} {...(shared as React.InputHTMLAttributes<HTMLInputElement>)} />}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
      style={{ background: checked ? "var(--navy)" : "var(--border)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
        style={{ marginLeft: checked ? "18px" : "2px" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  // Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Organization
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgLegalName, setOrgLegalName] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgProvince, setOrgProvince] = useState("BC");
  const [orgCity, setOrgCity] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgMission, setOrgMission] = useState("");
  const [orgProgram, setOrgProgram] = useState("");
  const [orgBudget, setOrgBudget] = useState("");
  const [orgStaff, setOrgStaff] = useState("");
  const [orgVolunteers, setOrgVolunteers] = useState("");
  const [orgFounded, setOrgFounded] = useState("");
  const [orgFocusArea, setOrgFocusArea] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  // Billing
  const [orgTier, setOrgTier] = useState("FREE");
  const [aiUsed, setAiUsed] = useState(0);
  const [aiLimit, setAiLimit] = useState(10);
  const [hasStripe, setHasStripe] = useState(false);
  const [upgrading, setUpgrading] = useState("");
  const [annualBilling, setAnnualBilling] = useState(false);

  // Notifications
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyCompliance, setNotifyCompliance] = useState(true);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifySaved, setNotifySaved] = useState(false);

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then((orgs) => {
      if (orgs.length > 0) {
        const o = orgs[0];
        setOrgTier(o.currentTier ?? "FREE");
        setAiUsed(o.aiGenerationsUsed ?? 0);
        setHasStripe(!!o.stripeCustomerId);
        const limits: Record<string, number> = { FREE: 10, STARTER: 50, PRO: -1, ENTERPRISE: -1 };
        setAiLimit(limits[o.currentTier ?? "FREE"] ?? 10);
        setOrgId(o.id);
        setOrgName(o.name ?? "");
        setOrgLegalName(o.legalName ?? "");
        setOrgWebsite(o.website ?? "");
        setOrgProvince(o.province ?? "BC");
        setOrgCity(o.city ?? "");
        setOrgPhone(o.phone ?? "");
        setOrgMission(o.missionStatement ?? "");
        setOrgProgram(o.programDescription ?? "");
        setOrgBudget(o.annualBudget ? String(o.annualBudget) : "");
        setOrgStaff(o.staffCount != null ? String(o.staffCount) : "");
        setOrgVolunteers(o.volunteerCount != null ? String(o.volunteerCount) : "");
        setOrgFounded(o.foundedYear != null ? String(o.foundedYear) : "");
        setOrgFocusArea(o.primaryFocusArea ?? "");
      }
    });

    fetch("/api/settings").then((r) => r.json()).then((u) => {
      if (u?.name) setName(u.name);
      if (u?.email) setEmail(u.email);
      if (u?.notifyDeadlines != null) setNotifyDeadlines(u.notifyDeadlines);
      if (u?.notifyCompliance != null) setNotifyCompliance(u.notifyCompliance);
      if (u?.notifyTeam != null) setNotifyTeam(u.notifyTeam);
      if (u?.notifyDigest != null) setNotifyDigest(u.notifyDigest);
    });
  }, []);

  async function handleOrgSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setOrgSaving(true);
    await fetch(`/api/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName, legalName: orgLegalName, website: orgWebsite,
        province: orgProvince, city: orgCity, phone: orgPhone,
        missionStatement: orgMission, programDescription: orgProgram,
        annualBudget: orgBudget ? Number(orgBudget) : null,
        staffCount: orgStaff ? Number(orgStaff) : null,
        volunteerCount: orgVolunteers ? Number(orgVolunteers) : null,
        foundedYear: orgFounded ? Number(orgFounded) : null,
        primaryFocusArea: orgFocusArea || null,
      }),
    });
    setOrgSaving(false);
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 3000);
  }

  async function handleAccountSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setAccountError("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email: email || undefined, newPassword: newPassword || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setNewPassword("");
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setAccountError(d.error || "Failed to save");
    }
  }

  async function saveNotifications(patch: Partial<{ notifyDeadlines: boolean; notifyCompliance: boolean; notifyTeam: boolean; notifyDigest: boolean }>) {
    setNotifySaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setNotifySaving(false);
    setNotifySaved(true);
    setTimeout(() => setNotifySaved(false), 2000);
  }

  const notifItems = [
    { key: "notifyDeadlines", label: "Grant deadline reminders", desc: "Get notified 7 and 2 days before a deadline", value: notifyDeadlines, set: setNotifyDeadlines },
    { key: "notifyCompliance", label: "Compliance alerts", desc: "Alert when a grant falls below 70% compliance score", value: notifyCompliance, set: setNotifyCompliance },
    { key: "notifyTeam", label: "Team activity", desc: "Notify when a team member edits a grant section", value: notifyTeam, set: setNotifyTeam },
    { key: "notifyDigest", label: "Weekly digest", desc: "Receive a weekly email summary of deadlines and follow-ups", value: notifyDigest, set: setNotifyDigest },
  ] as const;

  return (
    <div>
      <TopNav title="Settings" subtitle="Manage your account and organization preferences" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">

        {/* Organization */}
        <div className="rounded-xl border overflow-hidden animate-fade-in" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Building2 className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Organization Profile</span>
          </div>
          <form onSubmit={handleOrgSave} className="p-5 space-y-4">
            {orgSaved && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Check className="h-4 w-4" /> Organization profile saved.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Organization Name" value={orgName} onChange={setOrgName} placeholder="Your nonprofit name" />
              <InputField label="Legal Name (if different)" value={orgLegalName} onChange={setOrgLegalName} placeholder="Registered legal name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Province</label>
                <select value={orgProvince} onChange={(e) => setOrgProvince(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}>
                  {PROVINCES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <InputField label="City" value={orgCity} onChange={setOrgCity} placeholder="Vancouver" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Website" value={orgWebsite} onChange={setOrgWebsite} type="url" placeholder="https://yourorganization.ca" />
              <InputField label="Phone" value={orgPhone} onChange={setOrgPhone} placeholder="+1 (604) 555-0100" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField label="Founded Year" value={orgFounded} onChange={setOrgFounded} type="number" placeholder="2010" />
              <InputField label="Annual Budget ($)" value={orgBudget} onChange={setOrgBudget} type="number" placeholder="500000" />
              <InputField label="Staff Count" value={orgStaff} onChange={setOrgStaff} type="number" placeholder="12" />
              <InputField label="Volunteers" value={orgVolunteers} onChange={setOrgVolunteers} type="number" placeholder="50" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>Primary Focus Area</label>
              <select value={orgFocusArea} onChange={(e) => setOrgFocusArea(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}>
                <option value="">Select focus area</option>
                {FOCUS_AREAS.map((f) => <option key={f} value={f}>{focusLabel(f)}</option>)}
              </select>
            </div>
            <InputField label="Mission Statement" value={orgMission} onChange={setOrgMission} as="textarea" placeholder="Describe your organization's mission..." />
            <InputField label="Program Description" value={orgProgram} onChange={setOrgProgram} as="textarea" placeholder="Describe your programs and services..." />
            <button type="submit" disabled={orgSaving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: orgSaving ? 0.7 : 1 }}>
              {orgSaving ? "Saving..." : "Save Organization"}
            </button>
          </form>
        </div>

        {/* Account */}
        <div className="rounded-xl border overflow-hidden animate-fade-in" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Shield className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Account & Security</span>
          </div>
          <form onSubmit={handleAccountSave} className="p-5 space-y-4">
            {accountError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{accountError}</p>}
            {saved && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Check className="h-4 w-4" /> Changes saved successfully.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <InputField label="Email" value={email} onChange={setEmail} type="email" placeholder="you@organization.org" />
            </div>
            <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="Leave blank to keep current" />
            <button type="submit" disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Update Account"}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border overflow-hidden animate-fade-in" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Notifications</span>
            </div>
            {notifySaved && (
              <span className="text-xs text-emerald-700 flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            {notifySaving && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Saving...</span>}
          </div>
          <div className="p-5 space-y-1">
            {notifItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "var(--warm-gray)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
                <Toggle
                  checked={item.value}
                  onChange={(v) => {
                    item.set(v as never);
                    saveNotifications({ [item.key]: v });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-xl border overflow-hidden animate-fade-in" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <CreditCard className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Plan & Billing</span>
          </div>
          <div className="p-5 space-y-5">
            {/* Current plan */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{orgTier.charAt(0) + orgTier.slice(1).toLowerCase()} Plan</p>
                  {orgTier !== "FREE" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(196,151,74,0.1)", color: "var(--gold)" }}>Active</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {orgTier === "FREE" && "3 active grants · 1 member · 10 AI generations/mo"}
                  {orgTier === "STARTER" && "10 active grants · 3 members · 50 AI generations/mo"}
                  {orgTier === "PRO" && "Unlimited grants · 10 members · Unlimited AI"}
                  {orgTier === "ENTERPRISE" && "Unlimited everything · Priority support"}
                </p>
              </div>
              {hasStripe && (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/billing/portal", { method: "POST" });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  Manage billing
                </button>
              )}
            </div>

            {/* AI usage bar */}
            {aiLimit > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium" style={{ color: "var(--navy)" }}>AI generations this month</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{aiUsed} / {aiLimit}</p>
                </div>
                <div className="h-1.5 rounded-full w-full" style={{ background: "var(--warm-gray)" }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (aiUsed / aiLimit) * 100)}%`, background: aiUsed >= aiLimit ? "#DC2626" : "var(--gold)" }} />
                </div>
                {aiUsed >= aiLimit && (
                  <p className="text-xs mt-1 text-red-600">Limit reached — upgrade to generate more</p>
                )}
              </div>
            )}

            {/* Upgrade plans */}
            {orgTier === "FREE" && (
              <div className="pt-2">
                {/* Billing toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Monthly</span>
                  <button
                    onClick={() => setAnnualBilling(!annualBilling)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ background: annualBilling ? "var(--navy)" : "var(--border)" }}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                      style={{ marginLeft: annualBilling ? "26px" : "4px" }}
                    />
                  </button>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Annual{" "}
                    <span className="font-bold" style={{ color: "#2EAD6B" }}>Save 20%</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { tier: "STARTER", name: "Starter", monthlyPrice: 49, annualPrice: 39, features: "10 grants · 3 members · 50 AI/mo" },
                    { tier: "PRO", name: "Pro", monthlyPrice: 99, annualPrice: 79, features: "Unlimited grants · 10 members · Unlimited AI", highlight: true },
                    { tier: "ENTERPRISE", name: "Enterprise", monthlyPrice: 299, annualPrice: 239, features: "Multi-org · Custom branding · Priority support" },
                  ].map((plan) => {
                    const displayPrice = annualBilling ? plan.annualPrice : plan.monthlyPrice;
                    return (
                      <div key={plan.tier}
                        className="rounded-xl border p-4 flex flex-col gap-2"
                        style={{
                          borderColor: plan.highlight ? "var(--gold)" : "var(--border)",
                          background: plan.highlight ? "rgba(196,151,74,0.04)" : "var(--cream)",
                        }}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{plan.name}</p>
                          {plan.highlight && <Zap className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />}
                        </div>
                        <div>
                          <p className="text-lg font-bold" style={{ color: plan.highlight ? "var(--gold)" : "var(--navy)" }}>
                            ${displayPrice}/mo
                          </p>
                          {annualBilling && (
                            <p className="text-xs" style={{ color: "#2EAD6B" }}>
                              ${plan.annualPrice * 12}/yr billed annually
                            </p>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{plan.features}</p>
                        <button
                          disabled={upgrading === plan.tier}
                          onClick={async () => {
                            setUpgrading(plan.tier);
                            const res = await fetch("/api/billing/checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ tier: plan.tier, annual: annualBilling }),
                            });
                            const { url, error } = await res.json();
                            setUpgrading("");
                            if (url) window.location.href = url;
                            else alert(error ?? "Failed to start checkout");
                          }}
                          className="mt-auto rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity"
                          style={{
                            background: plan.highlight
                              ? "linear-gradient(135deg, var(--navy-light), var(--navy))"
                              : "var(--navy)",
                            opacity: upgrading === plan.tier ? 0.7 : 1,
                          }}>
                          {upgrading === plan.tier ? "Redirecting..." : `Upgrade to ${plan.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="rounded-xl border overflow-hidden animate-fade-in" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Shield className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Data & Privacy</span>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>Export your data</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Download all your grants, sections, and account data as JSON.</p>
            </div>
            <a href="/api/account/export"
              className="text-xs font-semibold px-4 py-2 rounded-lg border transition-all hover:shadow-sm shrink-0"
              style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
              Export data
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
