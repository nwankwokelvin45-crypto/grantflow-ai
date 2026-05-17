import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { assignmentId } = await params;

  const assignment = await prisma.reviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: session.user.id },
    include: { rubric: true },
  });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const { criteriaScores, overallNotes } = await req.json() as {
    criteriaScores: { criteriaName: string; score: number; notes?: string }[];
    overallNotes?: string;
  };

  const totalScore = criteriaScores.reduce((sum, c) => sum + (c.score ?? 0), 0);

  const score = await prisma.reviewScore.create({
    data: {
      assignmentId,
      criteriaScores,
      totalScore,
      overallNotes: overallNotes ?? null,
    },
  });

  await prisma.reviewAssignment.update({
    where: { id: assignmentId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(score, { status: 201 });
}
