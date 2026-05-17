// PostHog server-side analytics
import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

export function track(userId: string, event: string, properties?: Record<string, unknown>) {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId: userId, event, properties });
}

export function identify(userId: string, props: Record<string, unknown>) {
  const client = getClient();
  if (!client) return;
  client.identify({ distinctId: userId, properties: props });
}

// Common events
export const Events = {
  SIGNED_UP: "signed_up",
  SIGNED_IN: "signed_in",
  GRANT_CREATED: "grant_created",
  GRANT_SUBMITTED: "grant_submitted",
  AI_GENERATED: "ai_generated",
  COMPLIANCE_CHECKED: "compliance_checked",
  UPGRADED: "plan_upgraded",
  INVITE_SENT: "invite_sent",
  DOCUMENT_UPLOADED: "document_uploaded",
} as const;
