import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

async function verifyAccess(grantId: string, userId: string) {
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    select: { organizationId: true },
  });
  if (!grant) return null;
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: grant.organizationId } },
  });
  return membership ? grant : null;
}

// GET — list all org documents, flagging which are attached to this grant
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const [allDocs, grantLinks] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId: grant.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.grantDocument.findMany({
      where: { grantId },
      select: { documentId: true },
    }),
  ]);

  const attachedIds = new Set(grantLinks.map((l) => l.documentId));

  return Response.json(
    allDocs.map((d) => ({
      ...d,
      signedUrl: `/uploads/${d.storageKey}`,
      attached: attachedIds.has(d.id),
    }))
  );
}

// POST — attach a document to this grant
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const { documentId } = await req.json() as { documentId: string };
  if (!documentId) return Response.json({ error: "documentId required" }, { status: 400 });

  await prisma.grantDocument.upsert({
    where: { grantId_documentId: { grantId, documentId } },
    create: { grantId, documentId },
    update: {},
  });

  return Response.json({ ok: true });
}

// DELETE — detach a document from this grant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { grantId } = await params;

  const grant = await verifyAccess(grantId, session.user.id);
  if (!grant) return Response.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) return Response.json({ error: "documentId required" }, { status: 400 });

  await prisma.grantDocument.deleteMany({ where: { grantId, documentId } });
  return Response.json({ ok: true });
}
