import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ funderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { funderId } = await params;

  const funder = await prisma.funder.findUnique({
    where: { id: funderId },
    include: {
      rules: { where: { isActive: true }, orderBy: { ruleType: "asc" } },
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!funder) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(funder);
}
