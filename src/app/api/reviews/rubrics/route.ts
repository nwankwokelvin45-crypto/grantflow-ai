import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const rubrics = await prisma.reviewRubric.findMany({
    where: { orgId: membership.organizationId },
    include: { _count: { select: { assignments: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(rubrics);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { name, description, criteria } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rubric = await prisma.reviewRubric.create({
    data: {
      orgId: membership.organizationId,
      name: name.trim(),
      description: description ?? null,
      criteria: criteria ?? [],
    },
  });
  return NextResponse.json(rubric, { status: 201 });
}
