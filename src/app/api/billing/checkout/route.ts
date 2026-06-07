import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { tier, annual = false } = await req.json() as { tier: PlanKey; annual?: boolean };
    const plan = PLANS[tier];
    const priceId = annual ? plan.annualPriceId : plan.priceId;

    if (!plan || !priceId) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const membership = await prisma.orgMembership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });
    if (!membership) return Response.json({ error: "No organization" }, { status: 403 });

    const org = membership.organization;
    const baseUrl = process.env.AUTH_URL;

    let customerId = org.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: org.name,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?upgraded=1`,
      cancel_url: `${baseUrl}/settings`,
      metadata: { organizationId: org.id, tier, billing: annual ? "annual" : "monthly" },
      subscription_data: {
        metadata: { organizationId: org.id, tier, billing: annual ? "annual" : "monthly" },
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
