import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
import { authLimiter } from "@/lib/ratelimit";
import { randomBytes } from "crypto";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = authLimiter(ip);
  if (!rl.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, hashedPassword },
    select: { id: true, name: true, email: true },
  });

  // Create email verification token (24h expiry)
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").trim();
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  // Send both emails — fire-and-forget
  sendWelcomeEmail(email, name).catch((e) => console.error("[register] welcome email:", e));
  sendVerificationEmail(email, verifyUrl).catch((e) => console.error("[register] verify email:", e));

  return Response.json(user, { status: 201 });
}
