import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ grantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { grantId } = await params;

    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      select: { organizationId: true },
    });
    if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: grant.organizationId } },
    });
    if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

    await prisma.grant.delete({ where: { id: grantId } });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[grants/delete]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
