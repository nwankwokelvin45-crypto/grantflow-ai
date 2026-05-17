import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sectionSchema = z.object({
  sectionKey: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  isRequired: z.boolean().default(true),
  minWords: z.number().nullable().optional(),
  maxWords: z.number().nullable().optional(),
  sortOrder: z.number().default(0),
});

const createFunderSchema = z.object({
  name: z.string().min(2),
  province: z.enum(["BC", "AB", "ON", "SK", "MB", "OTHER"]),
  website: z.string().optional(),
  contactEmail: z.string().optional(),
  description: z.string().optional(),
  focusAreas: z.array(z.string()).default([]),
  fundingTypes: z.array(z.string()).default([]),
  minGrantAmount: z.number().nullable().optional(),
  maxGrantAmount: z.number().nullable().optional(),
  deadlineType: z.enum(["ANNUAL", "ROLLING", "BIANNUAL", "QUARTERLY", "CLOSED"]).default("ANNUAL"),
  deadlineNotes: z.string().nullable().optional(),
  eligibleOrgTypes: z.array(z.string()).default([]),
  acceptsOnlineApps: z.boolean().default(true),
  sections: z.array(sectionSchema).default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const province = searchParams.get("province");
  const focusArea = searchParams.get("focusArea");

  const funders = await prisma.funder.findMany({
    where: {
      isActive: true,
      ...(province ? { province: province as any } : {}),
      ...(focusArea ? { focusAreas: { has: focusArea as any } } : {}),
    },
    include: {
      _count: { select: { rules: true, sections: true } },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(funders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createFunderSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sections, focusAreas, fundingTypes, eligibleOrgTypes, minGrantAmount, maxGrantAmount, ...rest } = parsed.data;

  const funder = await prisma.funder.create({
    data: {
      ...rest,
      focusAreas: focusAreas as any,
      fundingTypes: fundingTypes as any,
      eligibleOrgTypes: eligibleOrgTypes as any,
      minGrantAmount: minGrantAmount ?? undefined,
      maxGrantAmount: maxGrantAmount ?? undefined,
      sections: {
        create: sections.map((s, i) => ({
          sectionKey: s.sectionKey,
          label: s.label,
          description: s.description ?? null,
          isRequired: s.isRequired,
          minWords: s.minWords ?? null,
          maxWords: s.maxWords ?? null,
          sortOrder: s.sortOrder ?? i,
        })),
      },
    },
    include: { sections: true, _count: { select: { rules: true, sections: true } } },
  });

  return Response.json(funder, { status: 201 });
}
