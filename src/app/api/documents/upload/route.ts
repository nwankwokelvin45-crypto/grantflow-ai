import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase, BUCKET } from "@/lib/supabase";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
];

const MAX_BYTES = 25 * 1024 * 1024;

function detectCategory(name: string, mime: string) {
  const n = name.toLowerCase();
  if (n.includes("financial") || n.includes("statement") || mime.includes("excel")) return "FINANCIAL_STATEMENT";
  if (n.includes("board")) return "BOARD_LIST";
  if (n.includes("charity") || n.includes("cra")) return "CHARITY_STATUS";
  if (n.includes("letter") || n.includes("support")) return "LETTERS_OF_SUPPORT";
  if (n.includes("budget")) return "BUDGET";
  if (n.includes("annual") || n.includes("report")) return "ANNUAL_REPORT";
  if (mime.startsWith("image/")) return "PHOTOS";
  return "GENERAL";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.orgMembership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });
    if (!membership) return Response.json({ error: "No organization" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return Response.json({ error: "File type not supported" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "File exceeds 25MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storageKey = `${membership.organizationId}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storageKey, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[documents/upload] Supabase upload error:", uploadError);
      return Response.json({ error: "File upload failed" }, { status: 500 });
    }

    const doc = await prisma.document.create({
      data: {
        organizationId: membership.organizationId,
        uploadedById: session.user.id,
        name: file.name,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey,
        category: detectCategory(file.name, file.type) as any,
      },
    });

    return Response.json(doc, { status: 201 });
  } catch (err) {
    console.error("[documents/upload]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
