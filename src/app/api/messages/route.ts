import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const grantId = searchParams.get("grantId") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return Response.json({ error: "No organization" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: {
      organizationId: membership.organizationId,
      grantId: grantId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return Response.json(messages);
}

const sendSchema = z.object({
  content: z.string().min(1).max(4000),
  grantId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return Response.json({ error: "No organization" }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      organizationId: membership.organizationId,
      senderId: session.user.id,
      grantId: parsed.data.grantId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return Response.json(message, { status: 201 });
}
