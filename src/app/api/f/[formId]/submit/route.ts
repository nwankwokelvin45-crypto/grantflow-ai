import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: { id: formId, status: "PUBLISHED" },
    include: { fields: { orderBy: [{ step: "asc" }, { order: "asc" }] } },
  });
  if (!form) return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });

  const body = await req.json();
  const { email, name, data } = body;

  // Validate required fields
  for (const field of form.fields) {
    if (field.required && field.type !== "SECTION_HEADER") {
      const value = data?.[field.id];
      if (!value || (typeof value === "string" && !value.trim())) {
        return NextResponse.json({ error: `"${field.label}" is required` }, { status: 400 });
      }
    }
  }

  const submission = await prisma.formSubmission.create({
    data: {
      formId,
      data: data ?? {},
      email: email ?? null,
      name: name ?? null,
    },
  });

  return NextResponse.json({ ok: true, submissionId: submission.id }, { status: 201 });
}
