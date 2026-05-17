import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
  notifyDeadlines: z.boolean().optional(),
  notifyCompliance: z.boolean().optional(),
  notifyTeam: z.boolean().optional(),
  notifyDigest: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, notifyDeadlines: true, notifyCompliance: true, notifyTeam: true, notifyDigest: true },
  });

  return Response.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, newPassword, ...notifyPrefs } = parsed.data;

  const updateData: Record<string, unknown> = { ...notifyPrefs };
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (newPassword) updateData.hashedPassword = await bcrypt.hash(newPassword, 12);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, notifyDeadlines: true, notifyCompliance: true, notifyTeam: true, notifyDigest: true },
  });

  return Response.json(user);
}
