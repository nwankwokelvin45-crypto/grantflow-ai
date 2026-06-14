import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const req = await prisma.funderRequirement.findUnique({ where: { id } });
  if (!req) return Response.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: req.organizationId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.funderRequirement.delete({ where: { id } });
  return Response.json({ ok: true });
}
