import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

const SUPABASE_READY =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key-here";

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

  if (SUPABASE_READY) {
    const { supabase, BUCKET } = await import("@/lib/supabase");
    await supabase.storage.from(BUCKET).remove([doc.storageKey]);
  } else {
    try {
      await unlink(path.join(process.cwd(), "public", "uploads", doc.storageKey));
    } catch {
      // File may already be gone
    }
  }

  await prisma.document.delete({ where: { id } });
  return Response.json({ ok: true });
}
