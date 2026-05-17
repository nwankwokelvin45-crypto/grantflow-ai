import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  registrationType: z.string().optional(),
  province: z.enum(["BC", "AB", "ON", "SK", "MB", "OTHER"]),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  missionStatement: z.string().optional(),
  programDescription: z.string().optional(),
  primaryFocusArea: z.string().optional(),
  annualBudget: z.number().optional(),
  staffCount: z.number().optional(),
  volunteerCount: z.number().optional(),
  foundedYear: z.number().optional(),
  registrationNumber: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          _count: { select: { grants: true, members: true } },
        },
      },
    },
  });

  return Response.json(memberships.map((m) => ({ ...m.organization, role: m.memberRole })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      legalName: data.legalName,
      registrationNumber: data.registrationNumber,
      registrationType: (data.registrationType as any) ?? "NONPROFIT",
      province: data.province as any,
      city: data.city,
      website: data.website || null,
      phone: data.phone,
      missionStatement: data.missionStatement,
      programDescription: data.programDescription,
      primaryFocusArea: (data.primaryFocusArea as any) ?? null,
      annualBudget: data.annualBudget,
      staffCount: data.staffCount,
      volunteerCount: data.volunteerCount,
      foundedYear: data.foundedYear,
      members: {
        create: {
          userId: session.user.id,
          memberRole: "OWNER",
        },
      },
    },
  });

  return Response.json(org, { status: 201 });
}
