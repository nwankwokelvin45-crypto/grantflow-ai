import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { randomBytes } from "crypto";

// GET /api/auth/verify-email?token=xxx  — confirm verification
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return Response.redirect(new URL("/verify-email?error=missing", req.url));
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    return Response.redirect(new URL("/verify-email?error=expired", req.url));
  }

  // Mark email as verified and fetch user name for welcome email
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { name: true, emailVerified: true },
  });

  const alreadyVerified = !!user?.emailVerified;

  await prisma.user.updateMany({
    where: { email: record.identifier, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } });

  // Send welcome email now that account is confirmed (fire-and-forget)
  if (!alreadyVerified && user) {
    sendWelcomeEmail(record.identifier, user.name ?? "there").catch(
      (e) => console.error("[verify-email] welcome email:", e)
    );
  }

  return Response.redirect(new URL("/login?verified=1", req.url));
}

// POST /api/auth/verify-email  — resend verification email
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return ok to prevent enumeration
  if (!user || user.emailVerified) return Response.json({ ok: true });

  // Delete any existing token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").trim();
  await sendVerificationEmail(email, `${baseUrl}/api/auth/verify-email?token=${token}`);

  return Response.json({ ok: true });
}
