import { prisma } from "@/lib/prisma";
import { PLANS, PlanKey } from "@/lib/stripe";

export async function getOrgWithUsage(userId: string) {
  const membership = await prisma.orgMembership.findFirst({
    where: { userId },
    include: { organization: true },
  });
  return membership?.organization ?? null;
}

export async function checkAiLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tier: PlanKey;
}> {
  const org = await getOrgWithUsage(userId);
  if (!org) return { allowed: false, used: 0, limit: 0, tier: "FREE" };

  const tier = org.currentTier as PlanKey;
  const plan = PLANS[tier];
  const limit = plan.aiGenerationsPerMonth;

  // Reset counter monthly
  const now = new Date();
  const resetDate = new Date(org.aiGenerationsReset);
  const monthsPassed =
    (now.getFullYear() - resetDate.getFullYear()) * 12 +
    (now.getMonth() - resetDate.getMonth());

  if (monthsPassed >= 1) {
    await prisma.organization.update({
      where: { id: org.id },
      data: { aiGenerationsUsed: 0, aiGenerationsReset: now },
    });
    return { allowed: true, used: 0, limit, tier };
  }

  const used = org.aiGenerationsUsed;
  const allowed = limit === Infinity || used < limit;
  return { allowed, used, limit: limit === Infinity ? -1 : limit, tier };
}

export async function incrementAiUsage(userId: string) {
  const org = await getOrgWithUsage(userId);
  if (!org) return;
  await prisma.organization.update({
    where: { id: org.id },
    data: { aiGenerationsUsed: { increment: 1 } },
  });
}

export async function checkGrantLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  tier: PlanKey;
}> {
  const org = await getOrgWithUsage(userId);
  if (!org) return { allowed: false, count: 0, limit: 0, tier: "FREE" };

  const tier = org.currentTier as PlanKey;
  const limit = PLANS[tier].maxGrants;

  const count = await prisma.grant.count({
    where: {
      organizationId: org.id,
      status: { in: ["DRAFT", "IN_REVIEW"] },
    },
  });

  const allowed = limit === Infinity || count < limit;
  return { allowed, count, limit: limit === Infinity ? -1 : limit, tier };
}
