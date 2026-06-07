import Stripe from "stripe";

let _stripe: Stripe | undefined;

function getInstance(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return (getInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    annualPriceId: null,
    maxGrants: 3,
    maxMembers: 1,
    maxOrganizations: 1,
    aiGenerationsPerMonth: 25,
    price: 0,
    annualPrice: 0,
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER,
    annualPriceId: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    maxGrants: 10,
    maxMembers: 3,
    maxOrganizations: 1,
    aiGenerationsPerMonth: 50,
    price: 49,
    annualPrice: 39,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO,
    annualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
    maxGrants: Infinity,
    maxMembers: 10,
    maxOrganizations: 10,
    aiGenerationsPerMonth: Infinity,
    price: 99,
    annualPrice: 79,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    annualPriceId: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    maxGrants: Infinity,
    maxMembers: Infinity,
    maxOrganizations: 50,
    aiGenerationsPerMonth: Infinity,
    price: 299,
    annualPrice: 239,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
