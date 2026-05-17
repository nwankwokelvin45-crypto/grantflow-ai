import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runComplianceCheck } from "@/services/ai/complianceChecker";
import { z } from "zod";

const schema = z.object({ grantId: z.string() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { grantId } = parsed.data;

  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    include: {
      funder: { include: { rules: { where: { isActive: true } }, sections: true } },
      sections: true,
      organization: true,
    },
  });

  if (!grant) {
    return Response.json({ error: "Grant not found" }, { status: 404 });
  }

  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: grant.organizationId,
      },
    },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  const result = await runComplianceCheck(grant);

  // Persist result and update grant score
  await prisma.$transaction([
    prisma.complianceResult.create({
      data: {
        grantId,
        score: result.score,
        passedRules: result.passedRules,
        failedRules: result.failedRules,
        warningRules: result.warningRules,
        issues: result.issues as any,
      },
    }),
    prisma.grant.update({
      where: { id: grantId },
      data: { complianceScore: result.score, lastScoredAt: new Date() },
    }),
  ]);

  return Response.json(result);
}
