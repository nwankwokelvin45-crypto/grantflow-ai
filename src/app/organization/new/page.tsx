"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    legalName: "",
    registrationType: "NONPROFIT",
    province: "BC",
    city: "",
    registrationNumber: "",
    website: "",
    phone: "",
    missionStatement: "",
    programDescription: "",
    primaryFocusArea: "",
    foundedYear: "",
    staffCount: "",
    volunteerCount: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
        staffCount: form.staffCount ? Number(form.staffCount) : undefined,
        volunteerCount: form.volunteerCount ? Number(form.volunteerCount) : undefined,
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create organization");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white text-xl mb-4">
            G
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your organization</h1>
          <p className="text-gray-500 text-sm mt-1">This helps us tailor grant content to your nonprofit</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization name *</label>
                <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Community Arts Society" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Legal name (if different)</label>
                <input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0123456 B.C. Ltd." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CRA / Registry number</label>
                <input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="123456789 RR 0001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization type *</label>
                <select required value={form.registrationType} onChange={(e) => update("registrationType", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="NONPROFIT">Nonprofit</option>
                  <option value="REGISTERED_CHARITY">Registered Charity</option>
                  <option value="SOCIETY">Society (BC/AB)</option>
                  <option value="INDIGENOUS_ORGANIZATION">Indigenous Organization</option>
                  <option value="COOPERATIVE">Cooperative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Province *</label>
                <select required value={form.province} onChange={(e) => update("province", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="BC">British Columbia</option>
                  <option value="AB">Alberta</option>
                  <option value="ON">Ontario</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="MB">Manitoba</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Vancouver" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary focus area</label>
                <select value={form.primaryFocusArea} onChange={(e) => update("primaryFocusArea", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">— Select —</option>
                  <option value="ARTS_CULTURE">Arts & Culture</option>
                  <option value="ENVIRONMENT">Environment</option>
                  <option value="HEALTH">Health</option>
                  <option value="SOCIAL_SERVICES">Social Services</option>
                  <option value="EDUCATION">Education</option>
                  <option value="INDIGENOUS">Indigenous</option>
                  <option value="SPORT_RECREATION">Sport & Recreation</option>
                  <option value="HOUSING">Housing</option>
                  <option value="FOOD_SECURITY">Food Security</option>
                  <option value="SENIORS">Seniors</option>
                  <option value="YOUTH">Youth</option>
                  <option value="DISABILITY">Disability</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mission statement *</label>
                <textarea required rows={3} value={form.missionStatement} onChange={(e) => update("missionStatement", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="We exist to..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Program / service description</label>
                <textarea rows={3} value={form.programDescription} onChange={(e) => update("programDescription", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="We deliver..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Founded year</label>
                <input type="number" value={form.foundedYear} onChange={(e) => update("foundedYear", e.target.value)} min={1800} max={2025} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="2010" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Staff count</label>
                <input type="number" value={form.staffCount} onChange={(e) => update("staffCount", e.target.value)} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="12" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="604-555-0100" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60">
              {loading ? "Saving..." : "Save organization & go to dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
