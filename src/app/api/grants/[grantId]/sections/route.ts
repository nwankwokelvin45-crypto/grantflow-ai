import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/utils";
import { z } from "zod";

const updateSectionSchema = z.object({
  content: z.string(),
  isComplete: z.boolean().optional(),
});

async function verifyAccess(grantId: string, userId: string) {
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    select: { organizationId: true },
  });
  if (!grant) return null;
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: grant.organizationId } },
  });
  if (!membership) return null;
  return grant;
}

// PATCH — update section content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const { searchParams } = new URL(req.url);
  const sectionKey = searchParams.get("key");
  if (!sectionKey) return Response.json({ error: "sectionKey required" }, { status: 400 });

  const body = await req.json();
  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const { content, isComplete } = parsed.data;
  const wordCount = countWords(content);

  const section = await prisma.grantSection.update({
    where: { grantId_sectionKey: { grantId, sectionKey } },
    data: { content, wordCount, isComplete: isComplete ?? wordCount > 10 },
  });

  await prisma.grant.update({ where: { id: grantId }, data: { updatedAt: new Date() } });
  return Response.json(section);
}

// POST — add a new custom section
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const { label } = await req.json() as { label: string };
  if (!label?.trim()) return Response.json({ error: "label required" }, { status: 400 });

  // Generate a unique sectionKey from label
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  let sectionKey = base;
  let attempt = 0;
  while (attempt < 20) {
    const existing = await prisma.grantSection.findUnique({
      where: { grantId_sectionKey: { grantId, sectionKey } },
    });
    if (!existing) break;
    attempt++;
    sectionKey = `${base}_${attempt}`;
  }

  // Find current max sortOrder
  const last = await prisma.grantSection.findFirst({
    where: { grantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? 0) + 1;

  const section = await prisma.grantSection.create({
    data: {
      grantId,
      sectionKey,
      label: label.trim(),
      content: "",
      wordCount: 0,
      isComplete: false,
      aiGenerated: false,
      sortOrder,
    },
  });

  return Response.json(section, { status: 201 });
}

// DELETE — remove a section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const { searchParams } = new URL(req.url);
  const sectionKey = searchParams.get("key");
  if (!sectionKey) return Response.json({ error: "sectionKey required" }, { status: 400 });

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.grantSection.delete({
    where: { grantId_sectionKey: { grantId, sectionKey } },
  });

  return Response.json({ ok: true });
}

// PUT — reorder sections
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const { orderedKeys } = await req.json() as { orderedKeys: string[] };
  if (!Array.isArray(orderedKeys)) return Response.json({ error: "orderedKeys required" }, { status: 400 });

  await Promise.all(
    orderedKeys.map((sectionKey, i) =>
      prisma.grantSection.update({
        where: { grantId_sectionKey: { grantId, sectionKey } },
        data: { sortOrder: i },
      })
    )
  );

  return Response.json({ ok: true });
}
