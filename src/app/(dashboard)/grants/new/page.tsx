"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/layout/TopNav";

interface Funder {
  id: string;
  name: string;
  province: string;
  deadlineType: string;
  minGrantAmount: number | null;
  maxGrantAmount: number | null;
}

interface Org {
  id: string;
  name: string;
}

export default function NewGrantPage() {
  const router = useRouter();
  const [funders, setFunders] = useState<Funder[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [funderId, setFunderId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/funders").then((r) => r.json()),
      fetch("/api/organizations").then((r) => r.json()),
    ]).then(([f, o]) => {
      setFunders(f);
      setOrgs(o);
      if (o.length > 0) setOrganizationId(o[0].id);
      if (f.length > 0) setFunderId(f[0].id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        funderId,
        organizationId,
        deadline: deadline || undefined,
        requestedAmount: requestedAmount ? Number(requestedAmount) : undefined,
      }),
    });

    if (res.ok) {
      const grant = await res.json();
      router.push(`/grants/${grant.id}/write`);
    } else {
      setLoading(false);
    }
  }

  const selectedFunder = funders.find((f) => f.id === funderId);

  return (
    <div>
      <TopNav title="New Grant Application" subtitle="Start a new grant for one of your organizations" />
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Grant title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Youth After-School Arts Program 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization</label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Funder</label>
              <select
                value={funderId}
                onChange={(e) => setFunderId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <optgroup label="British Columbia">
                  {funders.filter((f) => f.province === "BC").map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Alberta">
                  {funders.filter((f) => f.province === "AB").map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </optgroup>
              </select>
              {selectedFunder && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {selectedFunder.deadlineType.toLowerCase()} intake
                  {selectedFunder.maxGrantAmount && ` · up to $${Number(selectedFunder.maxGrantAmount).toLocaleString("en-CA")}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount requested (CAD)</label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="25000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create grant & start writing →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
