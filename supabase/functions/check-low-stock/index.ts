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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabase();

    // Get low stock threshold from settings (default 10)
    const { data: setting } = await sb
      .from("app_settings")
      .select("value")
      .eq("key", "agent_config")
      .maybeSingle();

    const config = (setting?.value || {}) as Record<string, unknown>;
    const threshold = (config.lowStockThreshold as number) || 10;

    // Find products below threshold
    const { data: lowStock } = await sb
      .from("products")
      .select("id, sku, name, stock_quantity, category")
      .lte("stock_quantity", threshold)
      .order("stock_quantity", { ascending: true });

    if (!lowStock || lowStock.length === 0) {
      return new Response(JSON.stringify({ success: true, alerts_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing unresolved low-stock alerts to avoid duplicates
    const { data: existingAlerts } = await sb
      .from("admin_alerts")
      .select("metadata")
      .eq("alert_type", "low_stock")
      .in("status", ["pending", "acknowledged"]);

    const existingSkus = new Set(
      (existingAlerts || []).map((a: any) => (a.metadata as any)?.sku).filter(Boolean)
    );

    let created = 0;
    for (const product of lowStock) {
      if (existingSkus.has(product.sku)) continue;

      const severity = product.stock_quantity === 0 ? "critical" : product.stock_quantity <= 3 ? "high" : "medium";

      await sb.from("admin_alerts").insert({
        alert_type: "low_stock",
        severity,
        title: product.stock_quantity === 0
          ? `⚠️ OUT OF STOCK: ${product.name}`
          : `📦 Low Stock: ${product.name} (${product.stock_quantity} left)`,
        description: `Product ${product.sku} in ${product.category} has only ${product.stock_quantity} units remaining. Threshold is ${threshold}.`,
        metadata: { sku: product.sku, product_id: product.id, stock_quantity: product.stock_quantity, threshold },
        status: "pending",
      });
      created++;
    }

    // Also send WhatsApp alert to admin if critical items found
    const criticalItems = lowStock.filter(p => p.stock_quantity === 0);
    if (criticalItems.length > 0) {
      const { data: adminSettings } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", "admin_whatsapp")
        .maybeSingle();

      const adminPhone = adminSettings?.value as string;
      if (adminPhone && typeof adminPhone === "string" && adminPhone.length > 5) {
        const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        if (token && phoneId) {
          const names = criticalItems.map(p => `• ${p.name} (${p.sku})`).join("\n");
          await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: adminPhone,
              type: "text",
              text: { body: `🚨 *OUT OF STOCK ALERT*\n\nThe following products are out of stock:\n${names}\n\n_Please restock immediately._` },
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, alerts_created: created, low_stock_count: lowStock.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Low stock check error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
