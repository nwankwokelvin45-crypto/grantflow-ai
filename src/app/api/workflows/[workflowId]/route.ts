import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getOrgWorkflow(workflowId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return null;
  return prisma.workflow.findFirst({
    where: { id: workflowId, orgId: membership.organizationId },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 20 } },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workflowId } = await params;
  const wf = await getOrgWorkflow(workflowId, session.user.id);
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wf);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workflowId } = await params;
  const wf = await getOrgWorkflow(workflowId, session.user.id);
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      name: data.name ?? wf.name,
      description: data.description !== undefined ? data.description : wf.description,
      trigger: data.trigger ?? wf.trigger,
      steps: data.steps !== undefined ? data.steps : wf.steps,
      isActive: data.isActive !== undefined ? data.isActive : wf.isActive,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workflowId } = await params;
  const wf = await getOrgWorkflow(workflowId, session.user.id);
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.workflow.delete({ where: { id: workflowId } });
  return NextResponse.json({ ok: true });
}
