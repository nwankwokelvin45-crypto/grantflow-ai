import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkGrantLimit } from "@/lib/billing";
import { z } from "zod";

const createGrantSchema = z.object({
  title: z.string().min(2),
  funderId: z.string(),
  organizationId: z.string(),
  deadline: z.string().optional(),
  requestedAmount: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organizationId");

  if (!orgId) {
    return Response.json({ error: "organizationId required" }, { status: 400 });
  }

  // Verify membership
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const grants = await prisma.grant.findMany({
    where: { organizationId: orgId },
    include: {
      funder: { select: { id: true, name: true, province: true } },
      _count: { select: { sections: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(grants);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGrantSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Verify membership
  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: data.organizationId,
      },
    },
  });
  if (!membership) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check grant limit
  const grantLimit = await checkGrantLimit(session.user.id);
  if (!grantLimit.allowed) {
    return Response.json({
      error: "grant_limit_reached",
      message: `Your plan allows ${grantLimit.limit} active grants. Upgrade to create more.`,
      count: grantLimit.count,
      limit: grantLimit.limit,
      tier: grantLimit.tier,
    }, { status: 402 });
  }

  // Fetch funder sections to create grant sections
  const funderSections = await prisma.funderSection.findMany({
    where: { funderId: data.funderId },
    orderBy: { sortOrder: "asc" },
  });

  const grant = await prisma.grant.create({
    data: {
      title: data.title,
      organizationId: data.organizationId,
      funderId: data.funderId,
      deadline: data.deadline ? new Date(data.deadline) : null,
      requestedAmount: data.requestedAmount,
      notes: data.notes,
      sections: {
        create: funderSections.map((s, i) => ({
          sectionKey: s.sectionKey,
          label: s.label,
          sortOrder: i,
        })),
      },
    },
    include: {
      funder: true,
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  return Response.json(grant, { status: 201 });
}
