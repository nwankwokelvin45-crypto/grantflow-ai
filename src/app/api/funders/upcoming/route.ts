import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextDeadline, getUrgency } from "@/lib/deadlines";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const funders = await prisma.funder.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        province: true,
        deadlineType: true,
        deadlineMonth: true,
        deadlineNotes: true,
        minGrantAmount: true,
        maxGrantAmount: true,
        focusAreas: true,
        website: true,
      },
      orderBy: [{ province: "asc" }, { name: "asc" }],
    });

    const now = new Date();

    const upcoming = funders
      .map((f) => {
        const nextDeadline = calculateNextDeadline(f.deadlineType, f.deadlineMonth);
        const daysLeft = nextDeadline
          ? Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const urgency = getUrgency(daysLeft, f.deadlineType);

        return {
          funderId: f.id,
          funderName: f.name,
          province: f.province,
          deadlineType: f.deadlineType,
          deadlineMonth: f.deadlineMonth,
          deadlineNotes: f.deadlineNotes,
          nextDeadline: nextDeadline?.toISOString() ?? null,
          daysUntil: daysLeft,
          urgency,
          minGrantAmount: f.minGrantAmount ? Number(f.minGrantAmount) : null,
          maxGrantAmount: f.maxGrantAmount ? Number(f.maxGrantAmount) : null,
          focusAreas: f.focusAreas,
          website: f.website,
        };
      })
      .filter((f) => f.urgency !== "overdue")
      .sort((a, b) => {
        if (a.urgency === "open" && b.urgency !== "open") return 1;
        if (b.urgency === "open" && a.urgency !== "open") return -1;
        if (a.daysUntil == null) return 1;
        if (b.daysUntil == null) return -1;
        return a.daysUntil - b.daysUntil;
      });

    return Response.json(upcoming);
  } catch (err) {
    console.error("[/api/funders/upcoming]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
