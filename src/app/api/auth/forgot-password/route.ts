import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { authLimiter } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = authLimiter(ip);
  if (!rl.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return Response.json({ ok: true });

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
