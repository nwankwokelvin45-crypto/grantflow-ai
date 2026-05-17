import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workflowId } = await params;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, orgId: membership?.organizationId },
  });
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!wf.isActive) return NextResponse.json({ error: "Workflow is inactive" }, { status: 400 });

  const { grantId } = await req.json().catch(() => ({}));

  const steps = Array.isArray(wf.steps) ? wf.steps as { action: string; assignee?: string; message?: string }[] : [];
  const history = steps.map((step, i) => ({
    step: i + 1,
    action: step.action,
    status: i === 0 ? "completed" : "pending",
    executedAt: i === 0 ? new Date().toISOString() : null,
  }));

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      grantId: grantId ?? null,
      status: steps.length <= 1 ? "COMPLETED" : "RUNNING",
      currentStep: 0,
      history,
      completedAt: steps.length <= 1 ? new Date() : null,
    },
  });

  return NextResponse.json(run, { status: 201 });
}
