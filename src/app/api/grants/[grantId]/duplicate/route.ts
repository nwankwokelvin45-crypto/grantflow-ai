import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ grantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { grantId } = await params;

    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: grant.organizationId } },
    });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    const duplicate = await prisma.grant.create({
      data: {
        title: `${grant.title} (Copy)`,
        organizationId: grant.organizationId,
        funderId: grant.funderId,
        status: "DRAFT",
        deadline: grant.deadline,
        requestedAmount: grant.requestedAmount,
        notes: grant.notes,
        sections: {
          create: grant.sections.map((s) => ({
            sectionKey: s.sectionKey,
            label: s.label,
            content: s.content,
            wordCount: s.wordCount,
            isComplete: s.isComplete,
            aiGenerated: s.aiGenerated,
            sortOrder: s.sortOrder,
          })),
        },
      },
    });

    return Response.json(duplicate, { status: 201 });
  } catch (err) {
    console.error("[grants/duplicate]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
