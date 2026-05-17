import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    maxGrants: 3,
    maxMembers: 1,
    aiGenerationsPerMonth: 10,
    price: 0,
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER,
    maxGrants: 10,
    maxMembers: 3,
    aiGenerationsPerMonth: 50,
    price: 49,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO,
    maxGrants: Infinity,
    maxMembers: 10,
    aiGenerationsPerMonth: Infinity,
    price: 99,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    maxGrants: Infinity,
    maxMembers: Infinity,
    aiGenerationsPerMonth: Infinity,
    price: 299,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
