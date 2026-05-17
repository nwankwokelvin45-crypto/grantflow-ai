import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase, BUCKET } from "@/lib/supabase";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: doc.organizationId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Remove from Supabase Storage (ignore errors if file is already gone)
  await supabase.storage.from(BUCKET).remove([doc.storageKey]);

  await prisma.document.delete({ where: { id } });
  return Response.json({ ok: true });
}
