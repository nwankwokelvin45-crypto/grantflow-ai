import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.orgMembership.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(members);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const { userId } = await req.json();

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.memberRole)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (userId === session.user.id) {
    return Response.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.orgMembership.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  return Response.json({ ok: true });
}
