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

  const assignments = await prisma.reviewAssignment.findMany({
    where: {
      grant: { organizationId: membership.organizationId },
    },
    include: {
      grant: { select: { id: true, title: true } },
      rubric: { select: { id: true, name: true, criteria: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      scores: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { grantId, rubricId, reviewerId, dueDate, isBlinded } = await req.json();

  const grant = await prisma.grant.findFirst({
    where: { id: grantId, organizationId: membership.organizationId },
  });
  if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

  const assignment = await prisma.reviewAssignment.create({
    data: {
      grantId,
      rubricId,
      reviewerId,
      dueDate: dueDate ? new Date(dueDate) : null,
      isBlinded: isBlinded ?? false,
    },
    include: {
      grant: { select: { id: true, title: true } },
      rubric: { select: { id: true, name: true, criteria: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      scores: true,
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
