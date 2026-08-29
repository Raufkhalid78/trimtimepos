/**
 * Creem.io Webhook Handler — Supabase Edge Function
 *
 * Listens for Creem payment events and updates the subscriptions table in Supabase.
 *
 * Events handled:
 *   - checkout.completed    → activate plan
 *   - subscription.active   → mark subscription as 'active'
 *   - subscription.paid     → sync plan / period dates
 *   - subscription.canceled → mark as 'cancelled'
 *
 * Required Supabase secrets (set via CLI or dashboard):
 *   CREEM_WEBHOOK_SECRET    — from Creem dashboard → Developers → Webhooks → Secret
 *   CREEM_TEST_WEBHOOK_SECRET — from Creem dashboard (Test Mode) → Developers → Webhooks → Secret
 *   SUPABASE_SERVICE_ROLE_KEY — your Supabase service_role key (bypasses RLS)
 *   SUPABASE_URL            — your Supabase project URL
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify the Creem webhook signature (HMAC-SHA256) */
async function verifyCreemSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  // Header can be raw hex or "t=...,v1=..."
  let receivedHex = signatureHeader.trim();
  if (receivedHex.includes("=")) {
    const parts = receivedHex.split(",");
    const v1Part = parts.find((p) => p.startsWith("v1=") || p.startsWith("sha256="));
    if (v1Part) {
      receivedHex = v1Part.split("=")[1];
    }
  }

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

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("creem-signature") || req.headers.get("x-creem-signature");
  const liveSecret = Deno.env.get("CREEM_WEBHOOK_SECRET");
  const testSecret = Deno.env.get("CREEM_TEST_WEBHOOK_SECRET");

  // Verify signature against either live or test webhook secret
  const secretsToCheck = [liveSecret, testSecret].filter(Boolean) as string[];

  if (secretsToCheck.length > 0) {
    let isValid = false;
    for (const secret of secretsToCheck) {
      if (await verifyCreemSignature(rawBody, signatureHeader, secret)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      console.error("[creem-webhook] Invalid signature against configured secrets.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    console.warn(
      "[creem-webhook] No webhook secret set — skipping signature verification (DEV only)."
    );
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Creem uses `eventType` (camelCase) or `event_type` or `event` or `type`
  const eventType: string = event.eventType || event.event_type || event.event || event.type || "";
  const data: any = event.object || event.data || event;
  const subscriptionData: any = data.subscription || data;

  console.log(`[creem-webhook] Received eventType: "${eventType}" (ID: ${event.id})`);

  // --- Supabase admin client (bypasses RLS) ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- Extract metadata across all possible Creem payload locations ---
  const metadata = 
    data.metadata || 
    subscriptionData?.metadata || 
    data.customer?.metadata || 
    data.checkout?.metadata || 
    event.metadata || 
    {};

  const tenantId: string | undefined = metadata.tenant_id;
  const rawPlan: string = (metadata.plan || "").toLowerCase();
  const productName: string = (data.product?.name || subscriptionData?.product?.name || "").toLowerCase();
  const productId: string = data.product?.id || subscriptionData?.product || "";

  const isAddon: boolean = 
    rawPlan === 'addon' || 
    productName.includes('add-on') || 
    productName.includes('addon') || 
    productId === 'prod_2ZUDSYB7rHdHN2CEoORQPT';

  const planType: 'monthly' | 'yearly' = rawPlan === 'yearly' ? 'yearly' : 'monthly';
  const planPrice: number = isAddon ? 10 : planType === 'yearly' ? 150 : 15;

  const eventId: string = event.id || `${eventType}_${data.id || Date.now()}`;

  if (!tenantId) {
    console.warn("[creem-webhook] No tenant_id in metadata — recording in webhook_events.");
    await supabase.from("webhook_events").upsert({
      id: eventId,
      provider: "creem",
      event_type: eventType,
      payload: event
    });
    return new Response(JSON.stringify({ ok: true, warning: "no tenant_id in metadata" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Handle event types ---
  const normalizedType = eventType.toLowerCase();

  if (
    normalizedType === "checkout.completed" ||
    normalizedType.includes("active") || 
    normalizedType.includes("created") || 
    normalizedType.includes("paid") ||
    data.status === "completed" ||
    subscriptionData?.status === "active"
  ) {
    if (isAddon) {
      // 🚀 Handle Scale Add-on pack purchase (+10 branches, +50 staff)
      const { data: currentSub } = await supabase
        .from("subscriptions")
        .select("add_on_packs")
        .eq("tenant_id", tenantId)
        .single();

      const newPacks = ((currentSub as any)?.add_on_packs || 0) + 1;
      const { error: addonError } = await supabase
        .from("subscriptions")
        .update({
          add_on_packs: newPacks,
        })
        .eq("tenant_id", tenantId);

      if (addonError) {
        console.error("[creem-webhook] Supabase add-on update error:", addonError.message);
        return new Response(JSON.stringify({ error: addonError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`[creem-webhook] 🚀 Scale Add-on pack activated for tenant: ${tenantId} (Total packs: ${newPacks})`);
    } else {
      // Extract start and end dates from Creem's subscription object
      const periodStart: string = 
        subscriptionData?.current_period_start_date || 
        data.current_period_start || 
        new Date().toISOString();

      const periodEnd: string = 
        subscriptionData?.current_period_end_date || 
        data.current_period_end || 
        new Date(Date.now() + (planType === "yearly" ? 365 : 30) * 86400000).toISOString();

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          plan: planType,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          price: planPrice,
        })
        .eq("tenant_id", tenantId);

      if (updateError) {
        console.error("[creem-webhook] Supabase update error:", updateError.message);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`[creem-webhook] ✅ Subscription successfully activated for tenant: ${tenantId} ($${planPrice}/${planType})`);
    }
  } else if (
    normalizedType.includes("canceled") || 
    normalizedType.includes("revoked") || 
    normalizedType.includes("expired")
  ) {
    const { error: cancelError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("tenant_id", tenantId);

    if (cancelError) {
      console.error("[creem-webhook] Supabase cancel error:", cancelError.message);
      return new Response(JSON.stringify({ error: cancelError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[creem-webhook] ❌ Subscription marked cancelled for tenant: ${tenantId}`);
  } else {
    console.log(`[creem-webhook] Recorded unhandled event type: "${eventType}"`);
  }

  // Record / update the event in the idempotency ledger
  await supabase.from("webhook_events").upsert({
    id: eventId,
    provider: "creem",
    event_type: eventType,
    tenant_id: tenantId,
    payload: event
  });

  return new Response(JSON.stringify({ ok: true, processed: true, tenant_id: tenantId, event_type: eventType }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
