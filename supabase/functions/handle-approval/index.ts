import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

// Send WhatsApp message to customer
async function sendWhatsAppToCustomer(phone: string, message: string): Promise<boolean> {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) {
    console.warn("WhatsApp credentials not set");
    return false;
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });

  if (!res.ok) {
    console.error("Failed to send WhatsApp message:", await res.text());
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alert_id, action, reply_message, override_amount } = await req.json();

    if (!alert_id || !action) {
      return new Response(JSON.stringify({ error: "alert_id and action required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = getSupabase();

    // Get the alert
    const { data: alert, error: alertErr } = await sb
      .from("admin_alerts")
      .select("*")
      .eq("id", alert_id)
      .single();

    if (alertErr || !alert) {
      return new Response(JSON.stringify({ error: "Alert not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata = (alert.metadata || {}) as Record<string, unknown>;
    const conversationId = alert.conversation_id;
    const orderId = alert.order_id;
    let customerPhone = metadata.customer_phone as string || "";
    let whatsappSent = false;

    // If no phone in metadata, try to get from conversation
    if (!customerPhone && conversationId) {
      const { data: conv } = await sb
        .from("conversations")
        .select("phone_number")
        .eq("id", conversationId)
        .single();
      if (conv?.phone_number) customerPhone = conv.phone_number;
    }

    switch (action) {
      case "approve": {
        // Update order status if linked
        if (orderId) {
          await sb.from("orders").update({ status: "confirmed" }).eq("id", orderId);
        }

        // Update alert
        await sb.from("admin_alerts").update({
          status: "resolved",
          resolution_note: "Approved by admin",
          resolved_at: new Date().toISOString(),
        }).eq("id", alert_id);

        // Notify customer
        if (customerPhone) {
          const msg = `✅ *Order Approved!*\n\nGreat news! Your order has been approved and is now being processed.\n\n${reply_message ? `_Admin note: ${reply_message}_` : ""}\n\nThank you for choosing MedSource! 🏥`;
          whatsappSent = await sendWhatsAppToCustomer(customerPhone, msg);
        }
        break;
      }

      case "reject": {
        if (orderId) {
          await sb.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        }

        await sb.from("admin_alerts").update({
          status: "resolved",
          resolution_note: reply_message || "Rejected by admin",
          resolved_at: new Date().toISOString(),
        }).eq("id", alert_id);

        if (customerPhone) {
          const msg = `❌ *Order Update*\n\nWe're sorry, but we couldn't process your order at this time.\n\n${reply_message ? `_Reason: ${reply_message}_` : ""}\n\nPlease contact us for assistance. Our team is here to help! 📞`;
          whatsappSent = await sendWhatsAppToCustomer(customerPhone, msg);
        }
        break;
      }

      case "reply": {
        if (!reply_message) {
          return new Response(JSON.stringify({ error: "reply_message required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await sb.from("admin_alerts").update({
          status: "acknowledged",
          resolution_note: reply_message,
        }).eq("id", alert_id);

        if (customerPhone) {
          const msg = `💬 *Message from MedSource Team*\n\n${reply_message}\n\n_Reply to this message or type "menu" for options._`;
          whatsappSent = await sendWhatsAppToCustomer(customerPhone, msg);
        }
        break;
      }

      case "override_price": {
        if (orderId && override_amount) {
          await sb.from("orders").update({
            total_amount: override_amount,
            status: "confirmed",
          }).eq("id", orderId);
        }

        await sb.from("admin_alerts").update({
          status: "resolved",
          resolution_note: `Price overridden to $${override_amount}`,
          resolved_at: new Date().toISOString(),
        }).eq("id", alert_id);

        if (customerPhone) {
          const msg = `✅ *Custom Pricing Approved!*\n\nYour order has been approved with special pricing of $${override_amount}.\n\nThank you for your business! 🏥`;
          whatsappSent = await sendWhatsAppToCustomer(customerPhone, msg);
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      whatsapp_sent: whatsappSent,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Approval error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
