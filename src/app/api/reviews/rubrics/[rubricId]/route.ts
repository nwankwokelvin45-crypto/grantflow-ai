import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ rubricId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rubricId } = await params;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  const rubric = await prisma.reviewRubric.findFirst({
    where: { id: rubricId, orgId: membership?.organizationId },
  });
  if (!rubric) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const updated = await prisma.reviewRubric.update({
    where: { id: rubricId },
    data: {
      name: data.name ?? rubric.name,
      description: data.description !== undefined ? data.description : rubric.description,
      criteria: data.criteria !== undefined ? data.criteria : rubric.criteria,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ rubricId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rubricId } = await params;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  const rubric = await prisma.reviewRubric.findFirst({
    where: { id: rubricId, orgId: membership?.organizationId },
  });
  if (!rubric) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.reviewRubric.delete({ where: { id: rubricId } });
  return NextResponse.json({ ok: true });
}
