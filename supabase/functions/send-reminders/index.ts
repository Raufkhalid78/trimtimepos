import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
const CENTRAL_WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper to dispatch WhatsApp message via UltraMsg or generic Webhook
 */
async function sendWhatsAppMessage(toPhone: string, message: string, customApiKey?: string): Promise<boolean> {
  const apiKey = customApiKey || CENTRAL_WHATSAPP_API_KEY;
  if (!apiKey) {
    console.log(`[send-reminders] No WhatsApp API key configured for message to: ${toPhone}`);
    return false;
  }

  const cleanPhone = toPhone.replace(/\D/g, "");
  if (!cleanPhone) return false;

  try {
    // If apiKey is a full URL (webhook)
    if (apiKey.startsWith("http://") || apiKey.startsWith("https://")) {
      await fetch(apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: cleanPhone, message: message })
      });
      return true;
    }

    // If apiKey contains instance:token format for UltraMsg (e.g. "instance99999:abcdef12345")
    if (apiKey.includes(":")) {
      const [instanceId, token] = apiKey.split(":");
      await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, to: cleanPhone, body: message })
      });
      return true;
    }

    // Default UltraMsg token format
    await fetch("https://api.ultramsg.com/instance/messages/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: apiKey, to: cleanPhone, body: message })
    });
    return true;
  } catch (err) {
    console.error(`[send-reminders] Error sending message to ${cleanPhone}:`, (err as Error).message);
    return false;
  }
}

serve(async (req: Request) => {
  // Allow GET and POST for easy manual testing or scheduled cron triggers
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours window
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);   // 2 hours window

    let processed24h = 0;
    let processed2h = 0;

    // 1. Fetch 24-Hour Reminders (between now + 12h and now + 25h)
    const { data: appts24h, error: err24h } = await supabase
      .from("appointments")
      .select("id, tenant_id, customer_name, customer_phone, start_time, reminder_sent_24h, status")
      .gte("start_time", now.toISOString())
      .lte("start_time", in24Hours.toISOString())
      .eq("reminder_sent_24h", false)
      .in("status", ["confirmed", "pending", "unconfirmed"]);

    if (err24h) {
      console.error("[send-reminders] Error querying 24h appointments:", err24h.message);
    } else if (appts24h && appts24h.length > 0) {
      // Gather settings for relevant tenants
      const tenantIds = [...new Set(appts24h.map(a => a.tenant_id))];
      const { data: settingsList } = await supabase
        .from("settings")
        .select("tenant_id, data, custom_whatsapp_api_key")
        .in("tenant_id", tenantIds);

      const settingsMap = new Map((settingsList || []).map(s => [s.tenant_id, s]));

      for (const appt of appts24h) {
        if (!appt.customer_phone) continue;

        const tenantSettings = settingsMap.get(appt.tenant_id);
        const shopName = tenantSettings?.data?.shopName || "TrimTime Salon";
        const customKey = tenantSettings?.custom_whatsapp_api_key || tenantSettings?.data?.customWhatsAppApiKey;

        const apptDate = new Date(appt.start_time);
        const dateStr = apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const msg = `Hi ${appt.customer_name || 'Valued Client'}! 👋 Reminder from *${shopName}*: Your appointment is scheduled for *${dateStr} at ${timeStr}*. See you soon!`;

        await sendWhatsAppMessage(appt.customer_phone, msg, customKey);
        await supabase.from("appointments").update({ reminder_sent_24h: true }).eq("id", appt.id);
        processed24h++;
      }
    }

    // 2. Fetch 2-Hour Reminders (between now and now + 2 hours)
    const { data: appts2h, error: err2h } = await supabase
      .from("appointments")
      .select("id, tenant_id, customer_name, customer_phone, start_time, reminder_sent_2h, status")
      .gte("start_time", now.toISOString())
      .lte("start_time", in2Hours.toISOString())
      .eq("reminder_sent_2h", false)
      .in("status", ["confirmed", "pending", "unconfirmed"]);

    if (err2h) {
      console.error("[send-reminders] Error querying 2h appointments:", err2h.message);
    } else if (appts2h && appts2h.length > 0) {
      const tenantIds = [...new Set(appts2h.map(a => a.tenant_id))];
      const { data: settingsList } = await supabase
        .from("settings")
        .select("tenant_id, data, custom_whatsapp_api_key")
        .in("tenant_id", tenantIds);

      const settingsMap = new Map((settingsList || []).map(s => [s.tenant_id, s]));

      for (const appt of appts2h) {
        if (!appt.customer_phone) continue;

        const tenantSettings = settingsMap.get(appt.tenant_id);
        const shopName = tenantSettings?.data?.shopName || "TrimTime Salon";
        const customKey = tenantSettings?.custom_whatsapp_api_key || tenantSettings?.data?.customWhatsAppApiKey;

        const apptDate = new Date(appt.start_time);
        const timeStr = apptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const msg = `Hi ${appt.customer_name || 'Valued Client'}! ⏰ Quick Reminder: Your appointment at *${shopName}* is starting soon at *${timeStr}*.`;

        await sendWhatsAppMessage(appt.customer_phone, msg, customKey);
        await supabase.from("appointments").update({ reminder_sent_2h: true }).eq("id", appt.id);
        processed2h++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        reminders_sent_24h: processed24h,
        reminders_sent_2h: processed2h
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (err) {
    console.error("[send-reminders] Fatal error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
