import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  province: z.enum(["BC", "AB", "ON", "SK", "MB", "OTHER"]).optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  missionStatement: z.string().optional(),
  programDescription: z.string().optional(),
  annualBudget: z.number().positive().optional().nullable(),
  staffCount: z.number().int().nonnegative().optional().nullable(),
  volunteerCount: z.number().int().nonnegative().optional().nullable(),
  foundedYear: z.number().int().optional().nullable(),
  primaryFocusArea: z.string().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.memberRole)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const org = await prisma.organization.update({
    where: { id: orgId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: parsed.data as any,
  });

  return Response.json(org);
}
