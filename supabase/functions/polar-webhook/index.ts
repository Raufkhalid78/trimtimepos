/**
 * Polar.sh Webhook Handler — Supabase Edge Function
 *
 * Listens for Polar payment events and updates the subscriptions table in Supabase.
 *
 * Events handled:
 *   - subscription.created  → mark subscription as 'active'
 *   - subscription.updated  → sync plan / period dates
 *   - subscription.canceled → mark as 'cancelled'
 *
 * Required Supabase secrets (set via CLI or dashboard):
 *   POLAR_WEBHOOK_SECRET   — from Polar dashboard → Webhooks → your endpoint → Secret
 *   SUPABASE_SERVICE_KEY   — your Supabase service_role key (bypasses RLS)
 *   SUPABASE_URL           — your Supabase project URL
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify the Polar webhook signature (HMAC-SHA256) */
async function verifyPolarSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  // Polar sends: "sha256=<hex_digest>"
  const [algo, receivedHex] = signatureHeader.split("=");
  if (algo !== "sha256" || !receivedHex) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const computedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === receivedHex;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // Polar only sends POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // --- Signature verification ---
  const webhookSecret = Deno.env.get("POLAR_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET is not set.");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const signatureHeader = req.headers.get("webhook-signature") ??
    req.headers.get("x-polar-signature");

  const isValid = await verifyPolarSignature(rawBody, signatureHeader, webhookSecret);
  if (!isValid) {
    console.warn("[polar-webhook] Invalid signature — request rejected.");
    return new Response("Unauthorized", { status: 401 });
  }

  // --- Parse event ---
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType: string = event.type ?? "";
  const data = event.data ?? {};

  console.log(`[polar-webhook] Received event: ${eventType}`);

  // --- Supabase admin client (bypasses RLS) ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- Extract our metadata (set when building the checkout URL) ---
  const metadata = data.metadata ?? data.checkout?.metadata ?? {};
  const tenantId: string | undefined = metadata.tenant_id;
  const planType: string = metadata.plan ?? "monthly"; // 'monthly' | 'yearly'

  if (!tenantId) {
    console.warn("[polar-webhook] No tenant_id in metadata — ignoring event.");
    // Return 200 so Polar doesn't keep retrying
    return new Response(JSON.stringify({ ok: true, skipped: "no tenant_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Handle event types ---
  if (eventType === "subscription.created" || eventType === "subscription.updated") {
    const isActive = data.status === "active";
    const periodStart: string = data.current_period_start ?? new Date().toISOString();
    const periodEnd: string = data.current_period_end ??
      new Date(Date.now() + (planType === "yearly" ? 365 : 30) * 86400000).toISOString();

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: isActive ? "active" : data.status ?? "active",
        plan: planType,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        price: planType === "yearly" ? 200 : 20,
      })
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[polar-webhook] Supabase update error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[polar-webhook] ✅ Subscription activated for tenant: ${tenantId}`);
  } else if (eventType === "subscription.canceled" || eventType === "subscription.revoked") {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[polar-webhook] Supabase cancel error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[polar-webhook] ❌ Subscription cancelled for tenant: ${tenantId}`);
  } else {
    console.log(`[polar-webhook] Unhandled event type: ${eventType} — ignoring.`);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
