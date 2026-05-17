import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendInviteEmail } from "@/lib/email";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return Response.json({ error: "Forbidden" }, { status: 403 });

  const invites = await prisma.teamInvite.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    orderBy: { id: "desc" },
  });

  return Response.json(invites);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId } = await params;

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.memberRole)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.teamInvite.create({
    data: {
      email: parsed.data.email,
      organizationId: orgId,
      role: parsed.data.role as any,
      invitedById: session.user.id,
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.AUTH_URL}/invite/${invite.token}`;

  // Fire-and-forget invite email
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
  sendInviteEmail(parsed.data.email, session.user.name ?? "A team member", org?.name ?? "your organization", inviteUrl)
    .catch((e) => console.error("[invites] invite email:", e));

  return Response.json({ ...invite, inviteUrl }, { status: 201 });
}
