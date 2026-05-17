"use client";

import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Issue {
  field: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  suggestion: string;
}

interface Props {
  issues: Issue[];
  score: number | null;
}

const severityConfig = {
  ERROR: {
    icon: AlertCircle,
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Error",
  },
  WARNING: {
    icon: AlertTriangle,
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Warning",
  },
  INFO: {
    icon: Info,
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  },
};

export default function ComplianceChecklist({ issues, score }: Props) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <p className="font-semibold text-green-700">All checks passed!</p>
        <p className="text-sm text-gray-500">
          Score: {score}/100 — Ready to export and submit.
        </p>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === "ERROR");
  const warnings = issues.filter((i) => i.severity === "WARNING");
  const infos = issues.filter((i) => i.severity === "INFO");

  return (
    <div className="space-y-3">
      {[...errors, ...warnings, ...infos].map((issue, idx) => {
        const config = severityConfig[issue.severity];
        const Icon = config.icon;
        return (
          <div key={idx} className={cn("rounded-lg border p-4", config.bg)}>
            <div className="flex items-start gap-3">
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.text)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", config.badge)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{issue.field}</span>
                </div>
                <p className={cn("text-sm font-medium", config.text)}>{issue.message}</p>
                <p className="text-sm text-gray-600 mt-1">{issue.suggestion}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
