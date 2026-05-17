import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getOrgForm(formId: string, userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) return null;
  return prisma.form.findFirst({ where: { id: formId, orgId: membership.organizationId } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = await getOrgForm(formId, session.user.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { type, label, placeholder, helpText, required, options, step } = await req.json();

  // Get max order for this step
  const maxOrder = await prisma.formField.aggregate({
    where: { formId, step: step ?? 1 },
    _max: { order: true },
  });

  const field = await prisma.formField.create({
    data: {
      formId,
      type: type ?? "SHORT_TEXT",
      label: label ?? "New question",
      placeholder: placeholder ?? null,
      helpText: helpText ?? null,
      required: required ?? false,
      options: options ?? null,
      step: step ?? 1,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(field, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  // Bulk reorder
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId } = await params;
  const form = await getOrgForm(formId, session.user.id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { orderedIds } = await req.json() as { orderedIds: string[] };
  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.formField.update({ where: { id }, data: { order: index } })
    )
  );
  return NextResponse.json({ ok: true });
}
