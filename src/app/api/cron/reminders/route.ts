import { prisma } from "@/lib/prisma";
import { sendWeeklyDigest } from "@/lib/email";
import { calculateNextDeadline } from "@/lib/deadlines";

// Secured with a shared secret — call via: GET /api/cron/reminders?secret=CRON_SECRET
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Users who want the weekly digest
    const users = await prisma.user.findMany({
      where: { notifyDigest: true },
      select: {
        id: true,
        name: true,
        email: true,
        organizationMemberships: {
          select: { organizationId: true },
        },
      },
    });

    const funders = await prisma.funder.findMany({
      where: { isActive: true },
      select: { name: true, deadlineType: true, deadlineMonth: true },
    });

    const upcomingDeadlines = funders
      .map((f) => {
        const next = calculateNextDeadline(f.deadlineType, f.deadlineMonth);
        const daysLeft = next
          ? Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return daysLeft != null && daysLeft >= 0 && daysLeft <= 60
          ? { funderName: f.name, daysLeft }
          : null;
      })
      .filter(Boolean) as { funderName: string; daysLeft: number }[];

    let sent = 0;
    for (const user of users) {
      const orgIds = user.organizationMemberships.map((m) => m.organizationId);

      const followUpGrants = await prisma.grant.findMany({
        where: {
          organizationId: { in: orgIds },
          followUpDate: { not: null, lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        },
        select: { title: true, followUpDate: true },
        orderBy: { followUpDate: "asc" },
        take: 5,
      });

      const followUps = followUpGrants
        .filter((g) => g.followUpDate)
        .map((g) => ({
          grantTitle: g.title,
          daysLeft: Math.ceil((g.followUpDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        }));

      if (upcomingDeadlines.length === 0 && followUps.length === 0) continue;

      await sendWeeklyDigest(user.email, user.name ?? "there", upcomingDeadlines, followUps)
        .catch((e) => console.error(`[cron] digest for ${user.email}:`, e));
      sent++;
    }

    return Response.json({ ok: true, sent });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
