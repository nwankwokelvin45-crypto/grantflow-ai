export interface UpcomingDeadline {
  funderId: string;
  funderName: string;
  province: string;
  deadlineType: string;
  deadlineMonth: number | null;
  deadlineNotes: string | null;
  nextDeadline: Date | null;
  daysUntil: number | null;
  urgency: "overdue" | "urgent" | "soon" | "upcoming" | "open";
  minGrantAmount: number | null;
  maxGrantAmount: number | null;
  focusAreas: string[];
  website: string | null;
}

// Returns the next deadline date for a funder based on their intake type
export function calculateNextDeadline(
  deadlineType: string,
  deadlineMonth: number | null
): Date | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  switch (deadlineType) {
    case "ANNUAL": {
      if (!deadlineMonth) return null;
      const thisYear = new Date(year, deadlineMonth - 1, 15);
      if (thisYear > now) return thisYear;
      return new Date(year + 1, deadlineMonth - 1, 15);
    }

    case "BIANNUAL": {
      // Spring (April) and Fall (October)
      const spring = new Date(year, 3, 15); // April 15
      const fall = new Date(year, 9, 15);   // Oct 15
      if (spring > now) return spring;
      if (fall > now) return fall;
      return new Date(year + 1, 3, 15);
    }

    case "QUARTERLY": {
      // End of each quarter: March, June, September, December
      const quarters = [
        new Date(year, 2, 31),  // March 31
        new Date(year, 5, 30),  // June 30
        new Date(year, 8, 30),  // September 30
        new Date(year, 11, 31), // December 31
      ];
      const next = quarters.find((d) => d > now);
      if (next) return next;
      return new Date(year + 1, 2, 31);
    }

    case "ROLLING":
    case "CLOSED":
    default:
      return null;
  }
}

export function getUrgency(daysLeft: number | null, deadlineType: string): UpcomingDeadline["urgency"] {
  if (deadlineType === "ROLLING") return "open";
  if (deadlineType === "CLOSED") return "overdue";
  if (daysLeft == null) return "upcoming";
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 14) return "urgent";
  if (daysLeft <= 30) return "soon";
  return "upcoming";
}

export const URGENCY_LABEL: Record<UpcomingDeadline["urgency"], string> = {
  overdue: "Closed",
  urgent: "Due Soon",
  soon: "This Month",
  upcoming: "Upcoming",
  open: "Open Year-Round",
};

export const URGENCY_COLOR: Record<UpcomingDeadline["urgency"], { bg: string; text: string; border: string }> = {
  overdue:  { bg: "rgba(220,38,38,0.08)",   text: "#DC2626", border: "rgba(220,38,38,0.3)" },
  urgent:   { bg: "rgba(234,88,12,0.08)",   text: "#EA580C", border: "rgba(234,88,12,0.3)" },
  soon:     { bg: "rgba(196,151,74,0.1)",   text: "var(--gold)", border: "rgba(196,151,74,0.4)" },
  upcoming: { bg: "rgba(74,124,196,0.08)", text: "#4A7CC4", border: "rgba(74,124,196,0.3)" },
  open:     { bg: "rgba(46,173,107,0.08)", text: "#2EAD6B", border: "rgba(46,173,107,0.3)" },
};
