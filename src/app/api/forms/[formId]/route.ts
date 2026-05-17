import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getOrgForm(formId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return null;
  return prisma.form.findFirst({
    where: { id: formId, orgId: membership.organizationId },
    include: {
      fields: { orderBy: [{ step: "asc" }, { order: "asc" }] },
      _count: { select: { submissions: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = await getOrgForm(formId, session.user.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = await getOrgForm(formId, session.user.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const updated = await prisma.form.update({
    where: { id: formId },
    data: {
      title: data.title ?? form.title,
      description: data.description !== undefined ? data.description : form.description,
      status: data.status ?? form.status,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = await getOrgForm(formId, session.user.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.form.delete({ where: { id: formId } });
  return NextResponse.json({ ok: true });
}
