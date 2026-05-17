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

  const workflows = await prisma.workflow.findMany({
    where: { orgId: membership.organizationId },
    include: { _count: { select: { runs: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(workflows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { name, description, trigger, steps } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const workflow = await prisma.workflow.create({
    data: {
      orgId: membership.organizationId,
      name: name.trim(),
      description: description ?? null,
      trigger: trigger ?? "MANUAL",
      steps: steps ?? [],
    },
  });
  return NextResponse.json(workflow, { status: 201 });
}
