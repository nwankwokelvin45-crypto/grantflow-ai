import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  funderName: z.string().min(2),
  rawText: z.string().min(20),
  funderId: z.string().optional(),
  fileName: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return Response.json([]);

  const requirements = await prisma.funderRequirement.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(requirements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return Response.json({ error: "No organization" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const req_ = await prisma.funderRequirement.create({
    data: {
      organizationId: membership.organizationId,
      funderName: parsed.data.funderName,
      rawText: parsed.data.rawText,
      funderId: parsed.data.funderId ?? null,
      fileName: parsed.data.fileName ?? null,
    },
  });

  return Response.json(req_, { status: 201 });
}
