import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Generate sequential invoice number: INV-YYMM-XXXX
async function generateInvoiceNumber(sb: any): Promise<string> {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `INV-${y}${m}`;

  const { count } = await sb
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .ilike("invoice_number", `${prefix}%`);

  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}

// Recalculate totals from product line items
function recalculateTotals(products: any[]): { subtotal: number; total: number } {
  let subtotal = 0;
  for (const p of products) {
    const lineTotal = (p.unit_price || 0) * (p.quantity || 0);
    p.line_total = Math.round(lineTotal * 100) / 100;
    subtotal += p.line_total;
  }
  return { subtotal: Math.round(subtotal * 100) / 100, total: Math.round(subtotal * 100) / 100 };
}

// Format invoice as WhatsApp-friendly text
function formatInvoiceText(invoice: any): string {
  const lines: string[] = [];
  lines.push(`📄 *INVOICE ${invoice.invoice_number}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*MedSource International*`);
  lines.push(`Pharmaceutical Exports Worldwide`);
  lines.push(``);
  lines.push(`*Bill To:* ${invoice.customer_name}`);
  if (invoice.company_name) lines.push(`*Company:* ${invoice.company_name}`);
  if (invoice.delivery_address) lines.push(`*Address:* ${invoice.delivery_address}`);
  lines.push(``);
  lines.push(`*Date:* ${new Date(invoice.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  if (invoice.due_date) {
    lines.push(`*Due Date:* ${new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  }
  lines.push(`*Order Ref:* #${invoice.order_id?.slice(0, 8) || "N/A"}`);
  lines.push(``);
  lines.push(`*─── Items ───*`);

  const products = invoice.products || [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    lines.push(`${i + 1}. *${p.name}* (${p.sku})`);
    lines.push(`   Qty: ${p.quantity.toLocaleString()} × $${Number(p.unit_price).toFixed(2)} = *$${Number(p.line_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*Subtotal:* $${Number(invoice.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (invoice.discount_total > 0) {
    lines.push(`*Discount:* -$${Number(invoice.discount_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  if (invoice.tax_total > 0) {
    lines.push(`*Tax:* $${Number(invoice.tax_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  lines.push(`*TOTAL: $${Number(invoice.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${invoice.currency}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);
  lines.push(`*Payment Terms:* Net 30 / Wire Transfer`);
  lines.push(`*Bank:* Details shared upon confirmation`);
  lines.push(``);
  lines.push(`_Thank you for choosing MedSource International! 🏥_`);
  lines.push(`_This is a system-generated invoice._`);

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, conversation_id } = await req.json();
    const sb = getSupabase();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invoice already exists for this order
    const { data: existing } = await sb
      .from("invoices")
      .select("*")
      .eq("order_id", order_id)
      .limit(1)
      .single();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        invoice: existing,
        invoice_text: formatInvoiceText(existing),
        already_exists: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the order
    const { data: order, error: orderErr } = await sb
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = (order.products as any[]) || [];
    const { subtotal, total } = recalculateTotals(products);
    const invoiceNumber = await generateInvoiceNumber(sb);

    // Create invoice
    const { data: invoice, error: invErr } = await sb
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
        conversation_id: conversation_id || order.conversation_id || null,
        customer_name: order.customer_name,
        delivery_address: order.delivery_address,
        products,
        subtotal,
        discount_total: 0,
        tax_total: 0,
        total_amount: total,
        currency: "USD",
        status: "issued",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (invErr) {
      console.error("Invoice creation error:", invErr);
      return new Response(JSON.stringify({ error: invErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log analytics event
    await sb.from("analytics_events").insert({
      event_type: "invoice_generated",
      event_data: { invoice_id: invoice.id, invoice_number: invoiceNumber, order_id, total_amount: total },
    });

    return new Response(JSON.stringify({
      success: true,
      invoice,
      invoice_text: formatInvoiceText(invoice),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Generate invoice error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
