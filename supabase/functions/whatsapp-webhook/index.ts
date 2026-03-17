import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Pricing tiers ────────────────────────────────────────
const PRICING_TIERS = [
  { minQty: 1, maxQty: 10, discountPct: 0 },
  { minQty: 11, maxQty: 50, discountPct: 10 },
  { minQty: 51, maxQty: 100, discountPct: 15 },
  { minQty: 101, maxQty: Infinity, discountPct: 20 },
];

function getDiscount(qty: number): number {
  return (PRICING_TIERS.find((t) => qty >= t.minQty && qty <= t.maxQty) ?? PRICING_TIERS[0]).discountPct;
}

// ── Supabase client ──────────────────────────────────────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── WhatsApp Message Senders ─────────────────────────────

function getWhatsAppCreds() {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials not configured");
  return { token, phoneId };
}

// Send plain text (with auto-chunking for long messages)
async function sendText(to: string, text: string): Promise<boolean> {
  const { token, phoneId } = getWhatsAppCreds();

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 4000) {
    const splitAt = remaining.lastIndexOf('\n', 4000);
    const bp = splitAt > 2000 ? splitAt : 4000;
    chunks.push(remaining.slice(0, bp));
    remaining = remaining.slice(bp).trim();
  }
  if (remaining) chunks.push(remaining);

  for (const chunk of chunks) {
    const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: chunk } }),
    });
    if (!resp.ok) {
      console.error("WhatsApp send error:", resp.status, await resp.text());
      return false;
    }
  }
  return true;
}

// Send interactive buttons (max 3 buttons, 20 char each)
async function sendButtons(to: string, body: string, buttons: { id: string; title: string }[], header?: string, footer?: string): Promise<boolean> {
  const { token, phoneId } = getWhatsAppCreds();

  const interactive: any = {
    type: "button",
    body: { text: body },
    action: {
      buttons: buttons.slice(0, 3).map(b => ({
        type: "reply",
        reply: { id: b.id, title: b.title.slice(0, 20) },
      })),
    },
  };
  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "interactive", interactive }),
  });
  if (!resp.ok) {
    console.error("WhatsApp buttons error:", resp.status, await resp.text());
    return false;
  }
  return true;
}

// Send interactive list menu
async function sendList(to: string, body: string, buttonText: string, sections: { title: string; rows: { id: string; title: string; description?: string }[] }[], header?: string, footer?: string): Promise<boolean> {
  const { token, phoneId } = getWhatsAppCreds();

  const interactive: any = {
    type: "list",
    body: { text: body },
    action: { button: buttonText.slice(0, 20), sections },
  };
  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "interactive", interactive }),
  });
  if (!resp.ok) {
    console.error("WhatsApp list error:", resp.status, await resp.text());
    return false;
  }
  return true;
}

// ── Tool functions ───────────────────────────────────────
async function searchProductTool(query: string): Promise<string> {
  const sb = getSupabase();
  // Split query into words for broader matching
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const searchTerms = [query, ...words];
  
  // Build OR conditions for each word
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
    // If no results, return all products as suggestions
    const { data: all } = await sb.from("products").select("sku, name, price_usd, category").order("name").limit(15);
    return JSON.stringify({ error: `No exact match for "${query}". Here are available products:`, suggestions: all });
  }
  return JSON.stringify(data);
}

async function listCatalogTool(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("products")
    .select("sku, name, price_usd, stock_quantity, category")
    .order("category")
    .limit(50);
  if (error) return JSON.stringify({ error: error.message });
  
  // Group by category for clean display
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

// ── Send admin alert ─────────────────────────────────────
async function triggerAdminAlert(alertType: string, severity: string, title: string, description: string, conversationId?: string, orderId?: string, metadata?: Record<string, unknown>) {
  try {
    const sb = getSupabase();
    await sb.from("admin_alerts").insert({
      alert_type: alertType,
      severity,
      title,
      description,
      conversation_id: conversationId ?? null,
      order_id: orderId ?? null,
      metadata: metadata ?? {},
      status: "pending",
    });

    // Also send WhatsApp/email notification via edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/send-admin-alert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alert_type: alertType, severity, title, description, conversation_id: conversationId, order_id: orderId, metadata }),
    }).catch(e => console.warn("Alert notification failed:", e));
  } catch (e) {
    console.error("Failed to create admin alert:", e);
  }
}

async function createOrderTool(args: {
  customer_name: string;
  products: { sku: string; name: string; quantity: number; unit_price: number; line_total: number }[];
  total_amount: number;
  delivery_address?: string;
  conversation_id?: string;
}): Promise<string> {
  const sb = getSupabase();

  // Check if order needs approval (threshold from app_settings)
  const { data: thresholdSetting } = await sb.from("app_settings").select("value").eq("key", "order_approval_threshold").single();
  const threshold = thresholdSetting ? Number(thresholdSetting.value) : 5000;
  const needsApproval = args.total_amount >= threshold;

  const { data, error } = await sb.from("orders").insert({
    customer_name: args.customer_name,
    products: args.products,
    total_amount: args.total_amount,
    delivery_address: args.delivery_address ?? null,
    conversation_id: args.conversation_id ?? null,
    status: needsApproval ? "pending_approval" : "pending",
  }).select("id").single();
  if (error) return JSON.stringify({ error: error.message });

  // Trigger alert for high-value orders
  if (needsApproval) {
    await triggerAdminAlert(
      "high_value_order", "critical",
      `⚠️ High-Value Order: $${args.total_amount.toLocaleString()}`,
      `${args.customer_name} placed an order for $${args.total_amount.toLocaleString()} — requires admin approval.`,
      args.conversation_id, data.id,
      { customer: args.customer_name, total: args.total_amount, products: args.products }
    );
    return JSON.stringify({ success: true, order_id: data.id, status: "pending_approval", message: "Order submitted for admin approval due to high value." });
  }

  // Alert for all new orders (lower severity)
  await triggerAdminAlert(
    "new_order", "low",
    `New Order: $${args.total_amount.toLocaleString()}`,
    `${args.customer_name} placed an order.`,
    args.conversation_id, data.id,
    { customer: args.customer_name, total: args.total_amount }
  );

  return JSON.stringify({ success: true, order_id: data.id });
}

async function createLeadTool(args: {
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  lead_score?: number;
  country?: string;
  conversation_id?: string;
}): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.from("leads").insert({
    company_name: args.company_name,
    contact_person: args.contact_person ?? null,
    phone: args.phone ?? null,
    email: args.email ?? null,
    lead_score: args.lead_score ?? 0,
    qualification_data: { country: args.country },
    conversation_id: args.conversation_id ?? null,
    status: "new",
  }).select("id").single();
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, lead_id: data.id });
}

// ── All tools definition ─────────────────────────────────
const ALL_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_product",
      description: "Search for pharmaceutical products by name, SKU, or category",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Product name, SKU, or category" } },
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
          base_price: { type: "number" },
          quantity: { type: "number" },
          currency: { type: "string", default: "USD" },
        },
        required: ["base_price", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a new order after collecting all required info",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: { sku: { type: "string" }, name: { type: "string" }, quantity: { type: "number" }, unit_price: { type: "number" }, line_total: { type: "number" } },
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
      description: "Save a qualified lead",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          contact_person: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          lead_score: { type: "number" },
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
      description: "List all available products in the catalog grouped by category. Use when user asks what's available, wants to browse, or says 'catalog'",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];
// ── Agent prompts (concise, WhatsApp-optimized) ──────────
const AGENT_PROMPTS: Record<string, string> = {
  pricing: `You are Aria, pricing specialist at MedSource International — a B2B pharmaceutical export company.

RULES:
- Use search_product tool to find real products and prices from our catalog
- Use list_catalog tool when user asks "what's available", "catalog", "show products", or wants to browse
- Use calculate_price tool for quotes with volume discounts
- Keep responses SHORT (3-5 lines max). This is WhatsApp, not email
- Use bold *text* for key numbers and product names
- Format prices clearly: *$X.XX per unit* or *$X,XXX total*
- Always mention minimum order: *$500 USD*
- If a product isn't found, show what IS available from the catalog — never say "I can't find it" without offering alternatives
- Never make medical claims

VOLUME DISCOUNTS:
11-50 units: 10% off | 51-100: 15% off | 101+: 20% off`,

  faq: `You are Aria, product info expert at MedSource International.

RULES:
- Answer in 2-4 lines MAX. Be direct.
- Use bold *text* for key info
- Format shipping clearly:
  • UAE/KSA/Nigeria/Kenya/Philippines: *7-10 days*
  • Other regions: *14-21 days*
- Payment: Wire transfer or L/C. 50% advance (new customers), Net 30 (established)
- Licensing: Valid pharmaceutical import license required
- If you can't answer, say so and offer to connect with the team`,

  order: `You are Aria, order specialist at MedSource International.

RULES:
- Use search_product to verify products exist before proceeding
- Use list_catalog when user asks what's available
- Use calculate_price for totals
- Collect info ONE step at a time — don't dump a list
- If a product isn't found, use list_catalog and suggest alternatives
- When all info is ready, use create_order tool
- Keep each message to 2-3 lines
- Use bold for order details

REQUIRED INFO (collect step by step):
1. Product(s) + quantity
2. Company name
3. Delivery country/address
4. Contact name + phone/email`,

  qualifier: `You are Aria, business development at MedSource International.

RULES:
- Qualify naturally through conversation, not interrogation
- Keep each message 2-3 lines
- When qualified, use create_lead tool
- Score: Licensed distributor=80, Hospital=60, Pharmacy=40, No license=10

QUALIFY (naturally, not all at once):
1. Company type
2. Country
3. License status
4. Volume needs`,

  greeting: `You are Aria, AI sales assistant for MedSource International.
Reply with ONLY this exact text, nothing else:
Welcome to *MedSource International* 🏥

Your trusted partner for pharmaceutical exports worldwide.`,
};

// ── Menu messages ────────────────────────────────────────

// Send the main menu with 4 clickable options
async function sendMainMenu(to: string): Promise<boolean> {
  return await sendList(
    to,
    "How can I help you today? Select an option below 👇",
    "View Options",
    [{
      title: "Our Services",
      rows: [
        { id: "menu_pricing", title: "💰 Get a Quote", description: "Product pricing & bulk discounts" },
        { id: "menu_order", title: "📦 Place an Order", description: "Start a new purchase order" },
        { id: "menu_faq", title: "ℹ️ Shipping & Info", description: "Licensing, payment & delivery" },
        { id: "menu_qualify", title: "🤝 Become a Buyer", description: "Register as a qualified buyer" },
      ],
    }],
    "MedSource International",
    "Pharmaceutical exports worldwide 🌍"
  );
}

// Map menu button IDs to agents
function getAgentFromMenuId(id: string): string | null {
  const map: Record<string, string> = {
    menu_pricing: "pricing",
    menu_order: "order",
    menu_faq: "faq",
    menu_qualify: "qualifier",
    menu_back: "greeting",
  };
  return map[id] || null;
}

// Menu label for display in conversation
function getMenuLabel(id: string): string {
  const map: Record<string, string> = {
    menu_pricing: "Get a Quote",
    menu_order: "Place an Order",
    menu_faq: "Shipping & Info",
    menu_qualify: "Become a Buyer",
  };
  return map[id] || id;
}

// ── Intent classification ────────────────────────────────
const CLASSIFIER_PROMPT = `You are an intent classifier for MedSource International, a pharmaceutical B2B export company.
Classify the user's intent into one of: PRICING, FAQ, ORDER, QUALIFICATION, ESCALATE, GREETING.
- GREETING: hi, hello, hey, start, menu, back
- PRICING: price, quote, cost, how much, rate, discount, bulk
- ORDER: order, buy, purchase, place order, checkout
- FAQ: shipping, delivery, license, payment, terms, info
- QUALIFICATION: register, become buyer, new customer, qualify
- ESCALATE: speak to human, agent, complaint, urgent issue
If unsure, default to FAQ.`;

async function classifyIntent(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<{ intent: string; confidence: number }> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: CLASSIFIER_PROMPT }, ...messages.slice(-4)],
      tools: [{
        type: "function",
        function: {
          name: "classify_intent",
          description: "Classify the user's intent",
          parameters: {
            type: "object",
            properties: {
              intent: { type: "string", enum: ["PRICING", "FAQ", "ORDER", "QUALIFICATION", "ESCALATE", "GREETING"] },
              confidence: { type: "number" },
            },
            required: ["intent", "confidence"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "classify_intent" } },
    }),
  });
  if (!resp.ok) return { intent: "FAQ", confidence: 0.5 };
  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (tc?.function?.arguments) {
    try { return JSON.parse(tc.function.arguments); } catch { /* fallback */ }
  }
  return { intent: "FAQ", confidence: 0.5 };
}

function intentToAgent(intent: string): string {
  const map: Record<string, string> = {
    PRICING: "pricing", FAQ: "faq", ORDER: "order",
    QUALIFICATION: "qualifier", ESCALATE: "escalate", GREETING: "greeting",
  };
  return map[intent] || "faq";
}

// ── Execute tool calls ───────────────────────────────────
async function executeTool(name: string, args: any, conversationId?: string): Promise<string> {
  switch (name) {
    case "search_product": return await searchProductTool(args.query);
    case "list_catalog": return await listCatalogTool();
    case "calculate_price": return calculatePriceTool(args.base_price, args.quantity, args.currency || "USD");
    case "create_order": return await createOrderTool({ ...args, conversation_id: conversationId });
    case "create_lead": return await createLeadTool({ ...args, conversation_id: conversationId });
    default: return JSON.stringify({ error: "Unknown tool" });
  }
}

// ── Get AI response (non-streaming) ──────────────────────
async function getAIResponse(
  agent: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  conversationId?: string
): Promise<string> {
  const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.faq;
  const useTools = ["pricing", "order", "qualifier", "faq"].includes(agent);

  let agentMessages: any[] = [{ role: "system", content: systemPrompt }, ...messages];
  let maxIterations = 5;

  while (maxIterations-- > 0) {
    const body: any = { model: "google/gemini-3-flash-preview", messages: agentMessages };
    if (useTools) body.tools = ALL_TOOLS;

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.error("AI error:", resp.status);
      return "Sorry, I'm having trouble right now. Please try again shortly.";
    }

    const data = await resp.json();
    const choice = data.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return choice?.message?.content || "I'm not sure how to help with that. Please select an option from the menu.";
    }

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

  const finalResp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: agentMessages }),
  });
  if (!finalResp.ok) return "Sorry, I'm having trouble right now.";
  const finalData = await finalResp.json();
  return finalData.choices?.[0]?.message?.content || "I'm not sure how to help with that.";
}

// ── Conversation management ──────────────────────────────
async function getOrCreateConversation(phone: string) {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from("conversations")
    .select("*")
    .eq("phone_number", phone)
    .eq("conversation_state", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  if (existing) return existing;

  const { data: created, error } = await sb
    .from("conversations")
    .insert({ phone_number: phone, messages: [], current_agent: "greeting", conversation_state: "active", lead_score: 0 })
    .select()
    .single();
  if (error) throw error;
  return created;
}

async function updateConversation(id: string, messages: any[], agent: string) {
  const sb = getSupabase();
  await sb.from("conversations").update({
    messages, current_agent: agent, updated_at: new Date().toISOString(),
  }).eq("id", id);
}

async function logEvent(eventType: string, eventData: Record<string, unknown>) {
  const sb = getSupabase();
  await sb.from("analytics_events").insert({ event_type: eventType, event_data: eventData });
}

// ── Extract message content from webhook payload ─────────
function extractMessageContent(message: any): { text: string; isMenuSelection: boolean; menuId?: string } | null {
  // Interactive button reply
  if (message.type === "interactive") {
    const reply = message.interactive?.button_reply || message.interactive?.list_reply;
    if (reply) {
      return { text: reply.title, isMenuSelection: true, menuId: reply.id };
    }
  }

  // Plain text
  if (message.type === "text" && message.text?.body) {
    return { text: message.text.body, isMenuSelection: false };
  }

  return null;
}

// ── Main handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: Webhook verification ──────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ Webhook verified");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming messages ────────────────────────────
  if (req.method === "POST") {
    try {
      const rawBody = await req.text();

      // Verify signature
      const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
      if (appSecret) {
        const signature = req.headers.get("x-hub-signature-256");
        if (signature) {
          const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
          const expected = "sha256=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
          if (expected !== signature) {
            console.error("❌ Invalid webhook signature");
            return new Response("Invalid signature", { status: 403 });
          }
        }
      }

      const body = JSON.parse(rawBody);
      const value = body?.entry?.[0]?.changes?.[0]?.value;

      if (!value?.messages || value.messages.length === 0) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const message = value.messages[0];
      const from = message.from;

      // Extract message content (text or interactive reply)
      const content = extractMessageContent(message);
      if (!content) {
        await sendText(from, "I can only process text messages at the moment. Please select an option from the menu! 😊");
        await sendMainMenu(from);
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`📩 WhatsApp from ${from}: ${content.text} ${content.isMenuSelection ? `[menu: ${content.menuId}]` : ""}`);

      const conversation = await getOrCreateConversation(from);
      const existingMessages = (conversation.messages as any[]) || [];
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      let agent: string;
      let aiResponse: string;

      // ── Handle menu selection ──────────────────────────
      if (content.isMenuSelection && content.menuId) {
        const menuAgent = getAgentFromMenuId(content.menuId);
        if (menuAgent === "greeting") {
          // Back to main menu
          await sendMainMenu(from);
          await updateConversation(conversation.id, [...existingMessages, { role: "user", content: content.text, timestamp: new Date().toISOString() }], "greeting");
          return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (menuAgent) {
          agent = menuAgent;
          // Send a contextual opening message based on selection
          const openingMessages: Record<string, string> = {
            pricing: "You selected *Get a Quote* 💰\n\nWhich product are you interested in? You can share a product name or category.",
            order: "You selected *Place an Order* 📦\n\nLet's get started! Which product(s) would you like to order?",
            faq: "You selected *Shipping & Info* ℹ️\n\nWhat would you like to know? I can help with shipping times, licensing, or payment terms.",
            qualifier: "You selected *Become a Buyer* 🤝\n\nGreat! Let me help you get registered. What's your company name?",
          };
          aiResponse = openingMessages[agent] || "How can I help?";

          // Send response + back button
          await sendText(from, aiResponse);
          await sendButtons(from, "Need something else?", [{ id: "menu_back", title: "↩️ Main Menu" }]);

          const updatedMessages = [
            ...existingMessages,
            { role: "user", content: `[Selected: ${getMenuLabel(content.menuId!)}]`, timestamp: new Date().toISOString() },
            { role: "assistant", content: aiResponse, agent_role: agent, timestamp: new Date().toISOString() },
          ];
          await updateConversation(conversation.id, updatedMessages, agent);
          await logEvent("whatsapp_message", { phone: from, intent: agent.toUpperCase(), agent, conversation_id: conversation.id, menu_selection: true });
          return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // ── Handle greeting / first message ────────────────
      const isGreeting = /^(hi|hello|hey|start|menu|hii|hiii|yo|sup|assalam|salam|namaste)$/i.test(content.text.trim());
      const isNewConversation = existingMessages.length === 0;

      if (isGreeting || isNewConversation) {
        // Send welcome + interactive menu
        const welcomeText = "Hi there! I'm *Aria*, your AI sales assistant at *MedSource International* 🏥\n\nYour trusted partner for pharmaceutical exports worldwide. 🌍";
        await sendText(from, welcomeText);
        await sendMainMenu(from);

        const updatedMessages = [
          ...existingMessages,
          { role: "user", content: content.text, timestamp: new Date().toISOString() },
          { role: "assistant", content: welcomeText, agent_role: "greeting", timestamp: new Date().toISOString() },
        ];
        await updateConversation(conversation.id, updatedMessages, "greeting");
        await logEvent("whatsapp_message", { phone: from, intent: "GREETING", agent: "greeting", conversation_id: conversation.id });
        return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Handle ongoing conversation ────────────────────
      const currentAgent = conversation.current_agent || "faq";
      const aiHistory = existingMessages.map((m: any) => ({ role: m.role as string, content: m.content as string }));
      aiHistory.push({ role: "user", content: content.text });

      // If user is already in a flow, continue with current agent
      if (["pricing", "order", "qualifier", "faq"].includes(currentAgent) && !isGreeting) {
        agent = currentAgent;
      } else {
        // Classify intent for free-text
        const classification = await classifyIntent(aiHistory.slice(-12), LOVABLE_API_KEY);
        agent = intentToAgent(classification.intent);
      }

      console.log(`🤖 Agent: ${agent}`);

      // Handle escalation
      if (agent === "escalate") {
        aiResponse = "I'll connect you with our team right away.\n\n📞 *+971-4-XXX-XXXX*\n📧 *sales@medsource.com*\n\nA team member will reach out within 24 hours.";
        await sendText(from, aiResponse);

        // Alert admin about escalation
        await triggerAdminAlert(
          "escalation", "high",
          `🔴 Customer Escalation`,
          `Customer ${from} requested human support. Check conversation for context.`,
          conversation.id, undefined,
          { phone: from, last_message: content.text }
        );
      } else {
        aiResponse = await getAIResponse(agent, aiHistory.slice(-20), LOVABLE_API_KEY, conversation.id);
        await sendText(from, aiResponse);

        // After AI response, show a subtle back-to-menu option
        await sendButtons(from, "Anything else?", [
          { id: "menu_back", title: "↩️ Main Menu" },
        ]);
      }

      const updatedMessages = [
        ...existingMessages,
        { role: "user", content: content.text, timestamp: new Date().toISOString() },
        { role: "assistant", content: aiResponse, agent_role: agent, timestamp: new Date().toISOString() },
      ];
      await updateConversation(conversation.id, updatedMessages, agent);
      await logEvent("whatsapp_message", { phone: from, intent: agent.toUpperCase(), agent, conversation_id: conversation.id });

      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response(JSON.stringify({ status: "error", message: String(e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
