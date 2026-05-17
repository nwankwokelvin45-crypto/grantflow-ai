import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  const form = await prisma.form.findFirst({ where: { id: formId, orgId: membership?.organizationId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await prisma.formSubmission.findMany({
    where: { formId },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(submissions);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;

  const membership = await prisma.orgMembership.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });
  const form = await prisma.form.findFirst({ where: { id: formId, orgId: membership?.organizationId } });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { submissionId, status, reviewNotes } = await req.json();
  const updated = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { status, reviewNotes },
  });
  return NextResponse.json(updated);
}
