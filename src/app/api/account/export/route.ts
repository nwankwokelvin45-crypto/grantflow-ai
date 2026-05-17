import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        notifyDeadlines: true,
        notifyCompliance: true,
        notifyTeam: true,
        notifyDigest: true,
      },
    }),
    prisma.orgMembership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            grants: {
              include: { sections: true },
            },
          },
        },
      },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    organizations: memberships.map((m) => ({
      role: m.memberRole,
      joinedAt: m.joinedAt,
      organization: {
        id: m.organization.id,
        name: m.organization.name,
        website: m.organization.website,
        province: m.organization.province,
        grants: m.organization.grants.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          deadline: g.deadline,
          requestedAmount: g.requestedAmount,
          createdAt: g.createdAt,
          sections: g.sections.map((s) => ({
            sectionKey: s.sectionKey,
            label: s.label,
            content: s.content,
            wordCount: s.wordCount,
            isComplete: s.isComplete,
          })),
        })),
      },
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="grant2fundn-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
