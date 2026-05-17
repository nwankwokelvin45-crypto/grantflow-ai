import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WritingWorkspace from "@/components/writing/WritingWorkspace";
import WritePageHeader from "@/components/writing/WritePageHeader";

export default async function WriteGrantPage({
  params,
}: {
  params: Promise<{ grantId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { grantId } = await params;

  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    include: {
      organization: true,
      funder: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
        },
      },
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!grant) notFound();

  // Verify membership
  const membership = await prisma.orgMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: grant.organizationId,
      },
    },
  });
  if (!membership) redirect("/dashboard");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WritePageHeader
        grantId={grantId}
        grantTitle={grant.title}
        funderName={grant.funder.name}
        orgName={grant.organization.name}
      />
      <div className="flex-1 overflow-hidden">
        <WritingWorkspace
          grantId={grant.id}
          funderName={grant.funder.name}
          funderSections={grant.funder.sections.map((s) => ({
            sectionKey: s.sectionKey,
            label: s.label,
            description: s.description,
            isRequired: s.isRequired,
            minWords: s.minWords,
            maxWords: s.maxWords,
          }))}
          initialSections={grant.sections.map((s) => ({
            id: s.id,
            sectionKey: s.sectionKey,
            label: s.label,
            content: s.content,
            wordCount: s.wordCount,
            isComplete: s.isComplete,
            aiGenerated: s.aiGenerated,
            sortOrder: s.sortOrder,
          }))}
          initialScore={grant.complianceScore}
        />
      </div>
    </div>
  );
}
