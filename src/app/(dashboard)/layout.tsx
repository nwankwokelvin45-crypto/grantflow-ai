import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import ChatBot from "@/components/ai/ChatBot";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get primary org for sidebar display + user role + email verification status
  const [membership, user] = await Promise.all([
    prisma.orgMembership.findFirst({
      where: { userId: session.user.id },
      include: { organization: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, emailVerified: true },
    }),
  ]);

  // Redirect unverified users — Google OAuth sets emailVerified automatically
  if (!user?.emailVerified) redirect("/verify-email");

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgName={membership?.organization.name} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 main-bg" style={{ color: "var(--text-primary)" }}>
        {children}
      </main>
      <ChatBot />
    </div>
  );
}
