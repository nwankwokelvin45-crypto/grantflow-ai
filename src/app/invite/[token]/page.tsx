import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⛔</p>
          <h1 className="font-serif font-bold text-xl mb-2" style={{ color: "var(--navy)" }}>Invite expired or invalid</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>This invite link is no longer valid. Ask your team admin to send a new one.</p>
          <Link href="/login" className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // If logged in, accept immediately
  if (session?.user?.id) {
    const existing = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: session.user.id, organizationId: invite.organizationId } },
    });

    if (!existing) {
      await prisma.orgMembership.create({
        data: { userId: session.user.id, organizationId: invite.organizationId, memberRole: invite.role },
      });
    }

    await prisma.teamInvite.update({
      where: { token },
      data: { acceptedAt: new Date(), invitedUserId: session.user.id },
    });

    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-sm text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-xl mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))", color: "white" }}>G</div>
        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "var(--navy)" }}>
          You&apos;re invited
        </h1>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          Join <strong style={{ color: "var(--navy)" }}>{invite.organization.name}</strong> on Grant2Fund'n
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
          Invited as <strong>{invite.role.toLowerCase()}</strong> · Expires {invite.expiresAt.toLocaleDateString()}
        </p>
        <div className="flex flex-col gap-3">
          <Link href={`/register?invite=${token}`}
            className="rounded-lg py-3 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
            Create account & join
          </Link>
          <Link href={`/login?invite=${token}`}
            className="rounded-lg border py-3 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
}
