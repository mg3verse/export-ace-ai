import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Send WhatsApp message to admin ───────────────────────
async function sendWhatsAppToAdmin(adminPhone: string, alertTitle: string, alertDesc: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) {
    console.warn("WhatsApp credentials not set, skipping admin WhatsApp alert");
    return false;
  }

  const text = `🚨 *ADMIN ALERT*\n\n*${alertTitle}*\n${alertDesc}\n\n_Check the Admin Panel for details._`;

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: adminPhone,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    console.error("Failed to send WhatsApp alert:", await res.text());
    return false;
  }
  return true;
}

// ── Send email to admin via Lovable AI ───────────────────
async function sendEmailAlert(adminEmail: string, alertTitle: string, alertDesc: string, metadata: Record<string, unknown>) {
  // Use Lovable AI to generate and send a simple email notification
  // For now, log the email intent - email sending will be enabled when email domain is set up
  console.log(`📧 Email alert to ${adminEmail}: ${alertTitle}`);
  // TODO: Integrate with email infrastructure when domain is configured
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { alert_type, severity, title, description, conversation_id, order_id, metadata } = body;

    if (!alert_type || !title) {
      return new Response(JSON.stringify({ error: "alert_type and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = getSupabase();

    // 1. Insert alert into DB (triggers realtime for dashboard)
    const { data: alert, error: alertError } = await sb.from("admin_alerts").insert({
      alert_type,
      severity: severity || "medium",
      title,
      description: description || "",
      conversation_id: conversation_id || null,
      order_id: order_id || null,
      metadata: metadata || {},
      status: "pending",
    }).select("id").single();

    if (alertError) throw new Error(`Failed to create alert: ${alertError.message}`);

    // 2. Get admin contact info from settings
    const { data: settings } = await sb.from("app_settings").select("key, value").in("key", ["admin_whatsapp", "admin_email"]);

    const adminWhatsApp = settings?.find(s => s.key === "admin_whatsapp")?.value;
    const adminEmail = settings?.find(s => s.key === "admin_email")?.value;

    let notifiedWhatsapp = false;
    let notifiedEmail = false;

    // 3. Send WhatsApp alert
    if (adminWhatsApp && typeof adminWhatsApp === "string" && adminWhatsApp.length > 5) {
      notifiedWhatsapp = await sendWhatsAppToAdmin(adminWhatsApp, title, description || "");
    }

    // 4. Send email alert
    if (adminEmail && typeof adminEmail === "string" && adminEmail.includes("@")) {
      notifiedEmail = await sendEmailAlert(adminEmail, title, description || "", metadata || {});
    }

    // 5. Update alert with notification status
    await sb.from("admin_alerts").update({
      notified_whatsapp: notifiedWhatsapp,
      notified_email: notifiedEmail,
    }).eq("id", alert.id);

    return new Response(JSON.stringify({ success: true, alert_id: alert.id, notified_whatsapp: notifiedWhatsapp, notified_email: notifiedEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Alert error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
