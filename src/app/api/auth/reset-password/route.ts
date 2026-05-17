import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 8) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return Response.json({ error: "Reset link is invalid or has expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
