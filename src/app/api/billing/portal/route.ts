import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.orgMembership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });
    if (!membership?.organization.stripeCustomerId) {
      return Response.json({ error: "No billing account" }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.organization.stripeCustomerId,
      return_url: `${process.env.AUTH_URL}/settings`,
    });

    return Response.json({ url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
