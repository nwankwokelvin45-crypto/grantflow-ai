import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Public endpoint — applicants look up their submissions by email
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const submissions = await prisma.formSubmission.findMany({
    where: { email },
    include: {
      form: {
        select: {
          id: true,
          title: true,
          description: true,
          org: { select: { name: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(
    submissions.map(s => ({
      id: s.id,
      formId: s.formId,
      formTitle: s.form.title,
      orgName: s.form.org.name,
      status: s.status,
      submittedAt: s.submittedAt,
      reviewNotes: s.reviewNotes,
    }))
  );
}
