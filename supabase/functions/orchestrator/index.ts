import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const PRICING_TIERS = [
  { minQty: 1, maxQty: 10, discountPct: 0 },
  { minQty: 11, maxQty: 50, discountPct: 10 },
  { minQty: 51, maxQty: 100, discountPct: 15 },
  { minQty: 101, maxQty: Infinity, discountPct: 20 },
];

function getDiscount(qty: number): number {
  return (PRICING_TIERS.find((t) => qty >= t.minQty && qty <= t.maxQty) ?? PRICING_TIERS[0]).discountPct;
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Tool implementations ─────────────────────────────────
async function searchProductTool(query: string): Promise<string> {
  const sb = getSupabase();
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const searchTerms = [query, ...words];
  const orConditions = searchTerms
    .map(term => `sku.ilike.%${term}%,name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
    .join(',');

  const { data, error } = await sb
    .from("products")
    .select("sku, name, price_usd, stock_quantity, category, description")
    .or(orConditions)
    .limit(8);
  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    const { data: all } = await sb.from("products").select("sku, name, price_usd, category").order("name").limit(15);
    return JSON.stringify({ error: `No exact match for "${query}". Here are available products:`, suggestions: all });
  }
  return JSON.stringify(data);
}

async function listCatalogTool(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.from("products").select("sku, name, price_usd, stock_quantity, category").order("category").limit(50);
  if (error) return JSON.stringify({ error: error.message });
  const grouped: Record<string, any[]> = {};
  for (const p of (data || [])) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push({ name: p.name, sku: p.sku, price: `$${p.price_usd}`, stock: p.stock_quantity });
  }
  return JSON.stringify(grouped);
}

function calculatePriceTool(basePrice: number, quantity: number, currency: string): string {
  const rates: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, AED: 3.67, NGN: 1550, KES: 153, PHP: 56.5, SAR: 3.75 };
  const disc = getDiscount(quantity);
  const unitPrice = basePrice * (1 - disc / 100);
  const subtotal = unitPrice * quantity;
  const rate = rates[currency] ?? 1;
  return JSON.stringify({
    basePrice, quantity, discountPct: disc,
    unitPrice: Math.round(unitPrice * 100) / 100,
    subtotalUSD: Math.round(subtotal * 100) / 100,
    currency, total: Math.round(subtotal * rate * 100) / 100,
  });
}

async function createOrderTool(args: any, conversationId?: string): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.from("orders").insert({
    customer_name: args.customer_name,
    products: args.products,
    total_amount: args.total_amount,
    delivery_address: args.delivery_address ?? null,
    conversation_id: conversationId ?? null,
    status: "pending",
  }).select("id").single();
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, order_id: data.id });
}

async function createLeadTool(args: any, conversationId?: string): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.from("leads").insert({
    company_name: args.company_name,
    contact_person: args.contact_person ?? null,
    phone: args.phone ?? null,
    email: args.email ?? null,
    lead_score: args.lead_score ?? 0,
    qualification_data: { country: args.country },
    conversation_id: conversationId ?? null,
    status: "new",
  }).select("id").single();
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, lead_id: data.id });
}

// ── Tool definitions ─────────────────────────────────────
const ALL_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_product",
      description: "Search for pharmaceutical products by name or SKU",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Product name or SKU" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_price",
      description: "Calculate price with volume discounts and currency conversion",
      parameters: {
        type: "object",
        properties: {
          base_price: { type: "number", description: "Base price per unit in USD" },
          quantity: { type: "number", description: "Number of units/boxes" },
          currency: { type: "string", description: "Target currency code", default: "USD" },
        },
        required: ["base_price", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a new order in the system after collecting all required info from the customer",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sku: { type: "string" }, name: { type: "string" },
                quantity: { type: "number" }, unit_price: { type: "number" },
                line_total: { type: "number" },
              },
              required: ["sku", "name", "quantity", "unit_price", "line_total"],
            },
          },
          total_amount: { type: "number" },
          delivery_address: { type: "string" },
        },
        required: ["customer_name", "products", "total_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Save a qualified lead to the database after gathering company info",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          contact_person: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          lead_score: { type: "number", description: "0-100 qualification score" },
          country: { type: "string" },
        },
        required: ["company_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_catalog",
      description: "List all available products grouped by category. Use when user asks what's available or wants to browse.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_invoice",
      description: "Generate an invoice for an existing order. Use when customer asks for invoice, bill, or receipt for their order.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to generate invoice for" },
        },
        required: ["order_id"],
      },
    },
  },
];

async function generateInvoiceTool(orderId: string, conversationId?: string): Promise<string> {
  const sb = getSupabase();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resp = await fetch(`${supabaseUrl}/functions/v1/generate-invoice`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId, conversation_id: conversationId }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    return JSON.stringify({ error: `Invoice generation failed: ${err}` });
  }
  return await resp.text();
}

async function executeTool(name: string, args: any, conversationId?: string): Promise<string> {
  switch (name) {
    case "search_product": return await searchProductTool(args.query);
    case "list_catalog": return await listCatalogTool();
    case "calculate_price": return calculatePriceTool(args.base_price, args.quantity, args.currency || "USD");
    case "create_order": return await createOrderTool(args, conversationId);
    case "create_lead": return await createLeadTool(args, conversationId);
    case "generate_invoice": return await generateInvoiceTool(args.order_id, conversationId);
    default: return JSON.stringify({ error: "Unknown tool" });
  }
}

// ── Intent classification ────────────────────────────────
const CLASSIFIER_PROMPT = `You are an intent classifier for MedSource International, a pharmaceutical B2B export company.
Analyze the user message and conversation context. Classify the intent.

INTENTS:
- PRICING: product prices, quotes, bulk discounts, cost comparisons
- FAQ: shipping, licensing, regulations, product info, company details
- ORDER: place, modify, track, or cancel an order
- INVOICE: invoice, bill, receipt, payment document, generate invoice
- QUALIFICATION: new buyer, company details, license verification, volume inquiries
- ESCALATE: complaints, legal issues, returns, anything needing human judgment
- GREETING: hello, hi, general chat, small talk

If unsure, default to FAQ.`;

const AGENT_PROMPTS: Record<string, string> = {
  pricing: `You are a pharmaceutical pricing specialist at MedSource International.
Use search_product and calculate_price tools to look up real prices from the catalog.
BULK DISCOUNTS: 5% above 200 boxes, 10% above 500 boxes. MIN ORDER VALUE: $500 USD.
Always ask for company name and country before quoting. Show breakdowns. Keep replies concise (WhatsApp style). Never make medical claims.`,

  faq: `You are a product information expert at MedSource International.
SHIPPING: UAE/Saudi Arabia/Nigeria/Kenya/Philippines: 7-10 days. Other: 14-21 days. All tracked.
LICENSING: Valid pharmaceutical import license required. GMP-certified. WHO-prequalified available.
PAYMENT: Wire transfer, L/C. 50% advance for new customers. Net 30 for established accounts.
Be helpful and precise. If unsure say "Let me get our team to confirm that." Never make medical claims. Keep concise.`,

  order: `You are an order collection specialist at MedSource International.
Use search_product to verify products and calculate_price for totals. When ALL info is collected, use create_order tool to save the order.
Collect: 1) Products & qty 2) Company name 3) Delivery address/country 4) Contact person 5) Phone/email 6) License number.
Min order $500. Check min quantities. Calculate totals with bulk discounts. Be thorough but efficient.`,

  qualifier: `You are a B2B lead qualifier at MedSource International.
Qualify: 1) Company type 2) Country 3) License status 4) Monthly volume 5) Current suppliers 6) Product interests.
When qualified, use create_lead tool to save. Score: Licensed distributor=80, Hospital chain=60, Single pharmacy=40, No license=10.
Be warm, don't pressure, qualify naturally. Offer to connect with sales team for qualified leads.`,

  invoice: `You are an invoice specialist at MedSource International.
Use generate_invoice tool to create invoices for customer orders.
RULES:
- If the customer mentions an order ID, use it directly with generate_invoice
- If no order ID mentioned, check the conversation context for recent order references
- Present the invoice details clearly after generation
- If no order is found, ask the customer for their order ID or details to look it up
Keep responses concise and professional.`,

  greeting: `You are Aria, the friendly AI sales assistant for MedSource International, a pharmaceutical B2B export company.
Greet the user warmly. Briefly introduce yourself and what you can help with:
- Product pricing and quotes
- Shipping and licensing info
- Placing orders
- Invoice generation
- Getting qualified as a buyer
Keep it short and inviting. Use a friendly emoji or two. Ask how you can help today.`,
};

async function classifyIntent(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<{ intent: string; confidence: number; entities: Record<string, unknown> }> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: CLASSIFIER_PROMPT }, ...messages.slice(-12)],
      tools: [{
        type: "function",
        function: {
          name: "classify_intent",
          description: "Classify the user's intent from the conversation",
          parameters: {
            type: "object",
            properties: {
              intent: { type: "string", enum: ["PRICING", "FAQ", "ORDER", "INVOICE", "QUALIFICATION", "ESCALATE", "GREETING"] },
              confidence: { type: "number", description: "0-1 confidence score" },
              entities: {
                type: "object",
                properties: {
                  product_names: { type: "array", items: { type: "string" } },
                  quantities: { type: "array", items: { type: "number" } },
                  company_name: { type: "string" },
                  country: { type: "string" },
                  contact_name: { type: "string" },
                },
              },
            },
            required: ["intent", "confidence", "entities"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "classify_intent" } },
    }),
  });

  if (!resp.ok) {
    console.error("Classification failed:", resp.status);
    await resp.text(); // consume body
    return { intent: "FAQ", confidence: 0.5, entities: {} };
  }

  const rawText = await resp.text();
  if (!rawText) {
    console.error("Classification returned empty body");
    return { intent: "FAQ", confidence: 0.5, entities: {} };
  }

  try {
    const data = JSON.parse(rawText);
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try { return JSON.parse(toolCall.function.arguments); } catch { /* fallback */ }
    }
  } catch (e) {
    console.error("Classification JSON parse error:", e, "body:", rawText.slice(0, 200));
  }
  return { intent: "FAQ", confidence: 0.5, entities: {} };
}

function intentToAgent(intent: string): string {
  const map: Record<string, string> = {
    PRICING: "pricing", FAQ: "faq", ORDER: "order", INVOICE: "invoice",
    QUALIFICATION: "qualifier", ESCALATE: "escalate", GREETING: "greeting",
  };
  return map[intent] || "faq";
}

// ── Main handler ───────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationId = context?.conversationId;

    // Step 1: Classify intent
    const classification = await classifyIntent(messages, LOVABLE_API_KEY);
    const agent = intentToAgent(classification.intent);

    console.log(`Intent: ${classification.intent} (${classification.confidence}) → Agent: ${agent}`);

    // Step 2: Handle escalation
    if (agent === "escalate") {
      const encoder = new TextEncoder();
      const body = encoder.encode(
        `data: ${JSON.stringify({ type: "meta", data: { intent: classification.intent, confidence: classification.confidence, agent: "orchestrator", entities: classification.entities } })}\n\n` +
        `data: ${JSON.stringify({ type: "escalate" })}\n\n` +
        `data: [DONE]\n\n`
      );
      return new Response(body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Step 3: For agents with tools, use tool calling loop then stream final; for others stream directly
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.faq;
    const useTools = ["pricing", "order", "qualifier"].includes(agent);

    if (useTools) {
      let agentMessages: any[] = [{ role: "system", content: systemPrompt }, ...messages];
      let maxIterations = 5;

      while (maxIterations-- > 0) {
        const toolResp = await fetch(AI_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: agentMessages,
            tools: ALL_TOOLS,
          }),
        });

        if (!toolResp.ok) break;
        const toolData = await toolResp.json();
        const choice = toolData.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (!toolCalls || toolCalls.length === 0) break;

        agentMessages.push(choice.message);
        for (const tc of toolCalls) {
          let result = "{}";
          try {
            const args = JSON.parse(tc.function.arguments);
            result = await executeTool(tc.function.name, args, conversationId);
          } catch (e) {
            result = JSON.stringify({ error: String(e) });
          }
          agentMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
        }
      }

      // Final streaming response
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: agentMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Agent error:", response.status, t);
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const metaEvent = `data: ${JSON.stringify({ type: "meta", data: { intent: classification.intent, confidence: classification.confidence, agent, entities: classification.entities } })}\n\n`;
      const metaBytes = new TextEncoder().encode(metaEvent);
      const combinedStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(metaBytes);
          const reader = response.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });
      return new Response(combinedStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-tool agents: simple streaming
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("Agent error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const metaEvent = `data: ${JSON.stringify({ type: "meta", data: { intent: classification.intent, confidence: classification.confidence, agent, entities: classification.entities } })}\n\n`;
    const metaBytes = new TextEncoder().encode(metaEvent);
    const agentStream = response.body!;

    const combinedStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(metaBytes);
        const reader = agentStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(combinedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("orchestrator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
