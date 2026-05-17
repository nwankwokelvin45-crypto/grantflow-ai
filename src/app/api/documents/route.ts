import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPABASE_READY =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key-here";

const SIGNED_URL_TTL = 3600;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.orgMembership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });
    if (!membership) return Response.json([]);

    const docs = await prisma.document.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
    });

    if (SUPABASE_READY) {
      const { supabase, BUCKET } = await import("@/lib/supabase");
      const docsWithUrls = await Promise.all(
        docs.map(async (doc) => {
          const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(doc.storageKey, SIGNED_URL_TTL);
          return { ...doc, signedUrl: data?.signedUrl ?? null };
        })
      );
      return Response.json(docsWithUrls);
    }

    // Dev fallback: serve from local public/uploads/
    return Response.json(
      docs.map((doc) => ({ ...doc, signedUrl: `/uploads/${doc.storageKey}` }))
    );
  } catch (err) {
    console.error("[documents GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
