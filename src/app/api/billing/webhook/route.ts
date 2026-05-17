import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

const TIER_MAP: Record<string, string> = {
  starter: "STARTER",
  pro: "PRO",
  enterprise: "ENTERPRISE",
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return Response.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        const tier = session.metadata?.tier?.toUpperCase();
        if (!orgId || !tier) break;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            currentTier: tier as any,
            stripeSubscriptionId: session.subscription as string,
            stripeSubscriptionStatus: "active",
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        if (!orgId) break;

        const tier = TIER_MAP[sub.metadata?.tier?.toLowerCase() ?? ""] ?? "FREE";
        const status = sub.status;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            currentTier: (status === "active" || status === "trialing" ? tier : "FREE") as any,
            stripeSubscriptionStatus: status,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        if (!orgId) break;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            currentTier: "FREE",
            stripeSubscriptionId: null,
            stripeSubscriptionStatus: "canceled",
          },
        });
        break;
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return Response.json({ error: "Handler error" }, { status: 500 });
  }
}
