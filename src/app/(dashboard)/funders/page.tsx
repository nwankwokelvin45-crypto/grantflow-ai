import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import AddFunderModal from "@/components/funders/AddFunderModal";

function normalizeUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default async function FundersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const funders = await prisma.funder.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { rules: true, sections: true } },
    },
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });

  const bcFunders = funders.filter((f) => f.province === "BC");
  const abFunders = funders.filter((f) => f.province === "AB");
  const otherFunders = funders.filter((f) => f.province !== "BC" && f.province !== "AB");

  function FunderCard({ funder }: { funder: typeof funders[0] }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{funder.name}</h3>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              funder.province === "BC" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
            }`}>
              {funder.province}
            </span>
          </div>
          {funder.website && (
            <a
              href={normalizeUrl(funder.website!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{funder.description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {funder.focusAreas.slice(0, 4).map((area) => (
            <span key={area} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
              {area.replace(/_/g, " ").toLowerCase()}
            </span>
          ))}
          {funder.focusAreas.length > 4 && (
            <span className="text-xs text-gray-400">+{funder.focusAreas.length - 4} more</span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
          <span className="text-gray-500">
            {funder.minGrantAmount && funder.maxGrantAmount
              ? `${formatCurrency(Number(funder.minGrantAmount))} – ${formatCurrency(Number(funder.maxGrantAmount))}`
              : "Amount varies"}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            funder.deadlineType === "ROLLING" ? "bg-green-50 text-green-700" :
            funder.deadlineType === "QUARTERLY" ? "bg-blue-50 text-blue-700" :
            "bg-gray-50 text-gray-600"
          }`}>
            {funder.deadlineType.toLowerCase()} intake
          </span>
        </div>

        <Link
          href={`/funders/${funder.id}`}
          className="mt-4 w-full flex justify-center rounded-lg border border-emerald-200 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          View requirements
        </Link>
      </div>
    );
  }

  return (
    <div>
      <TopNav
        title="Funder Database"
        subtitle={`${funders.length} funders with detailed requirements`}
        actions={<AddFunderModal />}
      />
      <div className="p-6 space-y-8">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-5 w-5 bg-blue-100 rounded text-blue-700 text-xs flex items-center justify-center font-bold">BC</span>
            British Columbia ({bcFunders.length})
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bcFunders.map((f) => <FunderCard key={f.id} funder={f} />)}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="h-5 w-5 bg-red-100 rounded text-red-700 text-xs flex items-center justify-center font-bold">AB</span>
            Alberta ({abFunders.length})
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {abFunders.map((f) => <FunderCard key={f.id} funder={f} />)}
          </div>
        </div>

        {otherFunders.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-5 w-5 bg-gray-100 rounded text-gray-600 text-xs flex items-center justify-center font-bold">🌐</span>
              National / Other ({otherFunders.length})
            </h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {otherFunders.map((f) => <FunderCard key={f.id} funder={f} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
