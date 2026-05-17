import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ grantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { grantId } = await params;
    const body = await req.json();

    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      select: { organizationId: true },
    });
    if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.orgMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: grant.organizationId,
        },
      },
    });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.grant.update({
      where: { id: grantId },
      data: {
        status: "SUBMITTED",
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
        submissionPortal: body.submissionPortal ?? null,
        submissionMethod: body.submissionMethod ?? null,
        submissionReference: body.submissionReference ?? null,
        submissionNotes: body.submissionNotes ?? null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      },
    });

    return Response.json(updated);
  } catch (err) {
    console.error("[/api/grants/submit]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update only follow-up date or notes without changing status
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ grantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { grantId } = await params;
    const body = await req.json();

    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      select: { organizationId: true },
    });
    if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.orgMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: grant.organizationId,
        },
      },
    });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.grant.update({
      where: { id: grantId },
      data: {
        submissionPortal: body.submissionPortal ?? undefined,
        submissionMethod: body.submissionMethod ?? undefined,
        submissionReference: body.submissionReference ?? undefined,
        submissionNotes: body.submissionNotes ?? undefined,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      },
    });

    return Response.json(updated);
  } catch (err) {
    console.error("[/api/grants/submit PUT]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
