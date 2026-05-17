import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase, BUCKET } from "@/lib/supabase";

const SIGNED_URL_TTL = 3600; // 1 hour

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

    // Generate signed URLs in parallel
    const docsWithUrls = await Promise.all(
      docs.map(async (doc) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(doc.storageKey, SIGNED_URL_TTL);
        return { ...doc, signedUrl: data?.signedUrl ?? null };
      })
    );

    return Response.json(docsWithUrls);
  } catch (err) {
    console.error("[documents GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
