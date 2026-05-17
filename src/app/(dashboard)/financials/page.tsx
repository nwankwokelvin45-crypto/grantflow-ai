"use client";

import React, { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { Printer, Plus, Trash2, TrendingUp, BarChart2 } from "lucide-react";

type LineItem = { id: string; label: string; amount: string };

function newItem(label = ""): LineItem {
  return { id: Math.random().toString(36).slice(2), label, amount: "" };
}

function parseAmt(v: string): number {
  const n = parseFloat(v.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  return n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Section({
  title,
  items,
  onChange,
  onAdd,
  onRemove,
  color = "#4A7CC4",
}: {
  title: string;
  items: LineItem[];
  onChange: (id: string, field: "label" | "amount", val: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  color?: string;
}) {
  const total = items.reduce((s, i) => s + parseAmt(i.amount), 0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</h4>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
          style={{ color, background: `${color}12` }}>
          <Plus className="h-3 w-3" /> Add line
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              value={item.label}
              onChange={(e) => onChange(item.id, "label", e.target.value)}
              placeholder="Description"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
              onFocus={(e) => (e.target.style.borderColor = color)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>$</span>
              <input
                value={item.amount}
                onChange={(e) => onChange(item.id, "amount", e.target.value)}
                placeholder="0.00"
                className="w-32 rounded-lg pl-6 pr-3 py-2 text-sm text-right outline-none"
                style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                onFocus={(e) => (e.target.style.borderColor = color)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <button onClick={() => onRemove(item.id)}
              className="rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "#DC2626" }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>Total {title}</span>
        <span className="text-sm font-bold" style={{ color }}>$ {fmt(total)}</span>
      </div>
    </div>
  );
}

// ── Income Statement ─────────────────────────────────────────────────────────

function IncomeStatement({ orgName, year }: { orgName: string; year: string }) {
  const [revenue, setRevenue] = useState<LineItem[]>([
    newItem("Government grants"),
    newItem("Foundation grants"),
    newItem("Donations"),
    newItem("Program fees"),
    newItem("Events & fundraising"),
  ]);
  const [expenses, setExpenses] = useState<LineItem[]>([
    newItem("Salaries & wages"),
    newItem("Benefits"),
    newItem("Rent & utilities"),
    newItem("Program expenses"),
    newItem("Professional services"),
    newItem("Office & supplies"),
    newItem("Travel"),
    newItem("Depreciation"),
  ]);

  function mutate(
    setter: React.Dispatch<React.SetStateAction<LineItem[]>>,
    id: string,
    field: "label" | "amount",
    val: string
  ) {
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  }

  const totalRev = revenue.reduce((s, i) => s + parseAmt(i.amount), 0);
  const totalExp = expenses.reduce((s, i) => s + parseAmt(i.amount), 0);
  const surplus = totalRev - totalExp;

  return (
    <div>
      <Section
        title="Revenue"
        color="#2EAD6B"
        items={revenue}
        onChange={(id, f, v) => mutate(setRevenue, id, f, v)}
        onAdd={() => setRevenue((p) => [...p, newItem()])}
        onRemove={(id) => setRevenue((p) => p.filter((i) => i.id !== id))}
      />
      <Section
        title="Expenses"
        color="#DC2626"
        items={expenses}
        onChange={(id, f, v) => mutate(setExpenses, id, f, v)}
        onAdd={() => setExpenses((p) => [...p, newItem()])}
        onRemove={(id) => setExpenses((p) => p.filter((i) => i.id !== id))}
      />
      {/* Net */}
      <div className="rounded-xl border p-4 mt-4" style={{
        background: surplus >= 0 ? "rgba(46,173,107,0.06)" : "rgba(220,38,38,0.06)",
        borderColor: surplus >= 0 ? "rgba(46,173,107,0.2)" : "rgba(220,38,38,0.2)",
      }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
            {surplus >= 0 ? "Net Surplus" : "Net Deficit"}
          </span>
          <span className="text-xl font-bold" style={{ color: surplus >= 0 ? "#2EAD6B" : "#DC2626" }}>
            {surplus < 0 ? "(" : ""}$ {fmt(Math.abs(surplus))}{surplus < 0 ? ")" : ""}
          </span>
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Total Revenue: ${fmt(totalRev)}</span>
          <span>Total Expenses: ${fmt(totalExp)}</span>
        </div>
      </div>

      {/* Print view (hidden on screen) */}
      <div id="print-income" className="hidden print:block">
        <PrintHeader title="Statement of Operations" orgName={orgName} year={year} />
        <PrintTable
          sections={[
            { title: "REVENUE", items: revenue, total: totalRev, color: "#2EAD6B" },
            { title: "EXPENSES", items: expenses, total: totalExp, color: "#DC2626" },
          ]}
          footer={{ label: surplus >= 0 ? "Net Surplus" : "Net Deficit", amount: surplus }}
        />
      </div>
    </div>
  );
}

// ── Balance Sheet ────────────────────────────────────────────────────────────

function BalanceSheet({ orgName, year }: { orgName: string; year: string }) {
  const [currentAssets, setCurrentAssets] = useState<LineItem[]>([
    newItem("Cash & bank"),
    newItem("Accounts receivable"),
    newItem("Short-term investments"),
    newItem("Prepaid expenses"),
  ]);
  const [fixedAssets, setFixedAssets] = useState<LineItem[]>([
    newItem("Equipment"),
    newItem("Furniture & fixtures"),
    newItem("Leasehold improvements"),
    newItem("Less: accumulated depreciation"),
  ]);
  const [currentLiabilities, setCurrentLiabilities] = useState<LineItem[]>([
    newItem("Accounts payable"),
    newItem("Accrued liabilities"),
    newItem("Deferred revenue"),
  ]);
  const [longTermLiabilities, setLongTermLiabilities] = useState<LineItem[]>([
    newItem("Loans payable"),
  ]);

  function mutate(
    setter: React.Dispatch<React.SetStateAction<LineItem[]>>,
    id: string,
    field: "label" | "amount",
    val: string
  ) {
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  }

  const totalCurrentAssets = currentAssets.reduce((s, i) => s + parseAmt(i.amount), 0);
  const totalFixedAssets = fixedAssets.reduce((s, i) => s + parseAmt(i.amount), 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiab = currentLiabilities.reduce((s, i) => s + parseAmt(i.amount), 0);
  const totalLongTermLiab = longTermLiabilities.reduce((s, i) => s + parseAmt(i.amount), 0);
  const totalLiabilities = totalCurrentLiab + totalLongTermLiab;

  const netAssets = totalAssets - totalLiabilities;
  const balanced = Math.abs(totalAssets - (totalLiabilities + netAssets)) < 0.01;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assets */}
      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-widest" style={{ color: "#4A7CC4" }}>Assets</h3>
        <Section title="Current Assets" color="#4A7CC4"
          items={currentAssets}
          onChange={(id, f, v) => mutate(setCurrentAssets, id, f, v)}
          onAdd={() => setCurrentAssets((p) => [...p, newItem()])}
          onRemove={(id) => setCurrentAssets((p) => p.filter((i) => i.id !== id))}
        />
        <Section title="Fixed Assets" color="#4A7CC4"
          items={fixedAssets}
          onChange={(id, f, v) => mutate(setFixedAssets, id, f, v)}
          onAdd={() => setFixedAssets((p) => [...p, newItem()])}
          onRemove={(id) => setFixedAssets((p) => p.filter((i) => i.id !== id))}
        />
        <div className="flex items-center justify-between rounded-xl px-4 py-3 mt-2"
          style={{ background: "rgba(74,124,196,0.08)", border: "1.5px solid rgba(74,124,196,0.2)" }}>
          <span className="font-bold text-sm" style={{ color: "#4A7CC4" }}>Total Assets</span>
          <span className="text-lg font-bold" style={{ color: "#4A7CC4" }}>$ {fmt(totalAssets)}</span>
        </div>
      </div>

      {/* Liabilities & Net Assets */}
      <div>
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-widest" style={{ color: "#7C3AED" }}>Liabilities & Net Assets</h3>
        <Section title="Current Liabilities" color="#7C3AED"
          items={currentLiabilities}
          onChange={(id, f, v) => mutate(setCurrentLiabilities, id, f, v)}
          onAdd={() => setCurrentLiabilities((p) => [...p, newItem()])}
          onRemove={(id) => setCurrentLiabilities((p) => p.filter((i) => i.id !== id))}
        />
        <Section title="Long-Term Liabilities" color="#7C3AED"
          items={longTermLiabilities}
          onChange={(id, f, v) => mutate(setLongTermLiabilities, id, f, v)}
          onAdd={() => setLongTermLiabilities((p) => [...p, newItem()])}
          onRemove={(id) => setLongTermLiabilities((p) => p.filter((i) => i.id !== id))}
        />
        <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-4"
          style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.2)" }}>
          <span className="font-bold text-sm" style={{ color: "#7C3AED" }}>Total Liabilities</span>
          <span className="text-lg font-bold" style={{ color: "#7C3AED" }}>$ {fmt(totalLiabilities)}</span>
        </div>

        {/* Net Assets (auto-calculated) */}
        <div className="rounded-xl border p-4" style={{
          background: netAssets >= 0 ? "rgba(46,173,107,0.06)" : "rgba(220,38,38,0.06)",
          borderColor: netAssets >= 0 ? "rgba(46,173,107,0.3)" : "rgba(220,38,38,0.3)",
        }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm" style={{ color: "var(--navy)" }}>Net Assets (Equity)</span>
            <span className="text-xl font-bold" style={{ color: netAssets >= 0 ? "#2EAD6B" : "#DC2626" }}>
              $ {fmt(netAssets)}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Auto-calculated: Total Assets − Total Liabilities
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${balanced ? "bg-emerald-500" : "bg-amber-400"}`} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {totalAssets === 0 ? "Enter values above to check balance" : balanced ? "Balance sheet is balanced" : "Note: Net assets auto-derived from inputs"}
            </span>
          </div>
        </div>
      </div>

      {/* Print view */}
      <div id="print-balance" className="hidden print:block col-span-2">
        <PrintHeader title="Balance Sheet" orgName={orgName} year={year} />
        <div className="print-two-col">
          <div>
            <PrintTable
              sections={[
                { title: "CURRENT ASSETS", items: currentAssets, total: totalCurrentAssets, color: "#4A7CC4" },
                { title: "FIXED ASSETS", items: fixedAssets, total: totalFixedAssets, color: "#4A7CC4" },
              ]}
              footer={{ label: "Total Assets", amount: totalAssets }}
            />
          </div>
          <div>
            <PrintTable
              sections={[
                { title: "CURRENT LIABILITIES", items: currentLiabilities, total: totalCurrentLiab, color: "#7C3AED" },
                { title: "LONG-TERM LIABILITIES", items: longTermLiabilities, total: totalLongTermLiab, color: "#7C3AED" },
              ]}
              footer={{ label: "Total Liabilities", amount: totalLiabilities }}
            />
            <div style={{ marginTop: 16, padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Net Assets (Equity)</strong>
                <strong>$ {fmt(netAssets)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, borderTop: "1px solid #ccc", paddingTop: 8 }}>
                <strong>Total Liabilities & Net Assets</strong>
                <strong>$ {fmt(totalLiabilities + netAssets)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Print helpers ────────────────────────────────────────────────────────────

function PrintHeader({ title, orgName, year }: { title: string; orgName: string; year: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{orgName || "Organization"}</h1>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "4px 0" }}>{title}</h2>
      <p style={{ fontSize: 12, color: "#666", margin: 0 }}>For the Year Ended December 31, {year}</p>
      <p style={{ fontSize: 10, color: "#999", margin: "4px 0 0" }}>All amounts in Canadian Dollars ($)</p>
    </div>
  );
}

function PrintTable({
  sections,
  footer,
}: {
  sections: { title: string; items: LineItem[]; total: number; color: string }[];
  footer: { label: string; amount: number };
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <tbody>
        {sections.map((sec) => (
          <React.Fragment key={sec.title}>
            <tr>
              <td colSpan={2} style={{ fontWeight: 700, paddingTop: 12, paddingBottom: 4, borderBottom: "1px solid #ccc", color: sec.color }}>
                {sec.title}
              </td>
            </tr>
            {sec.items.filter((i) => i.label || parseAmt(i.amount) !== 0).map((item) => (
              <tr key={item.id}>
                <td style={{ paddingLeft: 12, paddingTop: 3, paddingBottom: 3 }}>{item.label || "—"}</td>
                <td style={{ textAlign: "right", paddingTop: 3, paddingBottom: 3 }}>$ {fmt(parseAmt(item.amount))}</td>
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 600, paddingTop: 4, paddingBottom: 8, borderTop: "1px solid #eee" }}>Total {sec.title}</td>
              <td style={{ textAlign: "right", fontWeight: 600, paddingTop: 4, paddingBottom: 8, borderTop: "1px solid #eee" }}>$ {fmt(sec.total)}</td>
            </tr>
          </React.Fragment>
        ))}
        <tr>
          <td style={{ fontWeight: 700, paddingTop: 8, borderTop: "2px solid #333" }}>{footer.label}</td>
          <td style={{ textAlign: "right", fontWeight: 700, paddingTop: 8, borderTop: "2px solid #333" }}>
            {footer.amount < 0 ? "(" : ""}$ {fmt(Math.abs(footer.amount))}{footer.amount < 0 ? ")" : ""}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function FinancialsPage() {
  const [tab, setTab] = useState<"income" | "balance">("income");
  const [orgName, setOrgName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-income, #print-income *, #print-balance, #print-balance * { visibility: visible !important; }
          #print-income, #print-balance { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; }
          .print-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        }
      `}</style>

      <div className="animate-fade-in">
        <TopNav
          title="Financial Statements"
          subtitle="Build and export nonprofit financial statements"
          actions={
            <button onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Printer className="h-4 w-4" />
              Export / Print
            </button>
          }
        />

        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {/* Header fields */}
          <div className="rounded-xl border p-5 mb-6" style={{ background: "white", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Statement Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
                  Organization Name
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your Nonprofit Society"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--navy)" }}>
                  Fiscal Year
                </label>
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid var(--border)", background: "var(--cream)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: "var(--warm-gray)" }}>
            {[
              { key: "income" as const, label: "Income Statement", icon: TrendingUp },
              { key: "balance" as const, label: "Balance Sheet", icon: BarChart2 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
                style={tab === key
                  ? { background: "white", color: "var(--navy)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                  : { color: "var(--text-muted)" }}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Statement builder */}
          <div className="rounded-xl border p-6" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif font-bold text-lg" style={{ color: "var(--navy)" }}>
                  {tab === "income" ? "Statement of Operations" : "Balance Sheet"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {orgName || "Your Organization"} · Year ended December 31, {year}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(196,151,74,0.1)", color: "var(--gold)" }}>
                All amounts in CAD
              </span>
            </div>

            {tab === "income"
              ? <IncomeStatement orgName={orgName} year={year} />
              : <BalanceSheet orgName={orgName} year={year} />
            }
          </div>

          <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            Click "Export / Print" to save as PDF — use your browser's "Save as PDF" option in the print dialog.
          </p>
        </div>
      </div>
    </>
  );
}
