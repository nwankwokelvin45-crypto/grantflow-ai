import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/layout/TopNav";
import { formatCurrency } from "@/lib/utils";
import { ExternalLink, ArrowLeft, CheckCircle, FileText, AlertCircle } from "lucide-react";

export default async function FunderDetailPage({
  params,
}: {
  params: Promise<{ funderId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { funderId } = await params;

  const funder = await prisma.funder.findUnique({
    where: { id: funderId },
    include: {
      rules: { where: { isActive: true }, orderBy: { ruleType: "asc" } },
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!funder) notFound();

  const rulesByType = funder.rules.reduce((acc: Record<string, typeof funder.rules>, rule) => {
    if (!acc[rule.ruleType]) acc[rule.ruleType] = [];
    acc[rule.ruleType].push(rule);
    return acc;
  }, {});

  return (
    <div>
      <TopNav
        title={funder.name}
        subtitle={`${funder.province} · ${funder.deadlineType.toLowerCase()} intake`}
        actions={
          <div className="flex items-center gap-2">
            {funder.website && (
              <a
                href={funder.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
            <Link
              href="/funders"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-5">
          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{funder.description}</p>
          </div>

          {/* Required sections */}
          {funder.sections.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Required Sections
              </h2>
              <div className="space-y-3">
                {funder.sections.map((section) => (
                  <div key={section.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {section.minWords && (
                            <span className="text-xs text-gray-500">min {section.minWords}w</span>
                          )}
                          {section.maxWords && (
                            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                              max {section.maxWords}w
                            </span>
                          )}
                          {section.isRequired && (
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Required</span>
                          )}
                        </div>
                      </div>
                      {section.description && (
                        <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {Object.keys(rulesByType).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Compliance Rules
              </h2>
              <div className="space-y-4">
                {Object.entries(rulesByType).map(([type, rules]) => (
                  <div key={type}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {type.replace(/_/g, " ")}
                    </p>
                    <div className="space-y-2">
                      {rules.map((rule) => (
                        <div key={rule.id} className="flex items-start gap-2 text-sm">
                          <span className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${
                            rule.severity === "ERROR" ? "bg-red-400" :
                            rule.severity === "WARNING" ? "bg-amber-400" : "bg-blue-400"
                          }`} />
                          <div>
                            <p className="text-gray-700">{rule.message}</p>
                            {rule.helpText && <p className="text-xs text-gray-400 mt-0.5">{rule.helpText}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Grant details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Grant Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Province</dt>
                <dd className="font-medium text-gray-900">{funder.province}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Intake</dt>
                <dd className="font-medium text-gray-900 capitalize">{funder.deadlineType.toLowerCase()}</dd>
              </div>
              {funder.minGrantAmount && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Min grant</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(Number(funder.minGrantAmount))}</dd>
                </div>
              )}
              {funder.maxGrantAmount && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Max grant</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(Number(funder.maxGrantAmount))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Sections</dt>
                <dd className="font-medium text-gray-900">{funder.sections.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Rules</dt>
                <dd className="font-medium text-gray-900">{funder.rules.length}</dd>
              </div>
            </dl>
          </div>

          {/* Focus areas */}
          {funder.focusAreas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Focus Areas</h3>
              <div className="flex flex-wrap gap-1.5">
                {funder.focusAreas.map((area) => (
                  <span key={area} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    {area.replace(/_/g, " ").toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Funding types */}
          {funder.fundingTypes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Funding Types</h3>
              <div className="flex flex-wrap gap-1.5">
                {funder.fundingTypes.map((type) => (
                  <span key={type} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {type.replace(/_/g, " ").toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply CTA */}
          <Link
            href={`/grants/new`}
            className="w-full flex justify-center rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Apply with this funder →
          </Link>
        </div>
      </div>
    </div>
  );
}
