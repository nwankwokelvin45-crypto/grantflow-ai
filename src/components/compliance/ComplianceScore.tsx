"use client";

import { cn, complianceColor, complianceBg } from "@/lib/utils";

interface Props {
  score: number | null;
  size?: "sm" | "lg";
  showLabel?: boolean;
}

export default function ComplianceScore({ score, size = "sm", showLabel = true }: Props) {
  const label =
    score == null
      ? "Not checked"
      : score >= 85
      ? "Ready to submit"
      : score >= 60
      ? "Needs attention"
      : "Not compliant";

  return (
    <div className={cn("flex items-center gap-2", size === "lg" ? "flex-col" : "flex-row")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold",
          complianceBg(score),
          complianceColor(score),
          size === "lg" ? "h-24 w-24 text-3xl" : "h-10 w-10 text-sm"
        )}
      >
        {score != null ? score : "—"}
      </div>
      {showLabel && (
        <div>
          <p className={cn("font-medium", size === "lg" ? "text-lg" : "text-sm", complianceColor(score))}>
            {label}
          </p>
          {size === "lg" && (
            <p className="text-sm text-gray-500 mt-0.5">
              {score != null ? `${score}/100 compliance score` : "Run a compliance check"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
