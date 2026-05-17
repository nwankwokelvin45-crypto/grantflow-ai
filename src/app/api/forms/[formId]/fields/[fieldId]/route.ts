import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ formId: string; fieldId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId, fieldId } = await params;

  const field = await prisma.formField.findFirst({ where: { id: fieldId, formId } });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const updated = await prisma.formField.update({
    where: { id: fieldId },
    data: {
      label: data.label ?? field.label,
      placeholder: data.placeholder !== undefined ? data.placeholder : field.placeholder,
      helpText: data.helpText !== undefined ? data.helpText : field.helpText,
      required: data.required !== undefined ? data.required : field.required,
      options: data.options !== undefined ? data.options : field.options,
      type: data.type ?? field.type,
      step: data.step !== undefined ? data.step : field.step,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ formId: string; fieldId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { formId, fieldId } = await params;

  const field = await prisma.formField.findFirst({ where: { id: fieldId, formId } });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.formField.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
