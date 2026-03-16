import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Pricing tiers (same as orchestrator) ─────────────────
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

// ── Tool functions ───────────────────────────────────────
async function searchProductTool(query: string): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("products")
    .select("sku, name, price_usd, stock_quantity, category")
    .or(`sku.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(5);
  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) return JSON.stringify({ error: "No products found" });
  return JSON.stringify(data);
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

async function createOrderTool(args: {
  customer_name: string;
  products: { sku: string; name: string; quantity: number; unit_price: number; line_total: number }[];
  total_amount: number;
  delivery_address?: string;
  conversation_id?: string;
}): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.from("orders").insert({
    customer_name: args.customer_name,
    products: args.products,
    total_amount: args.total_amount,
    delivery_address: args.delivery_address ?? null,
    conversation_id: args.conversation_id ?? null,
    status: "pending",
  }).select("id").single();
  if (error) return JSON.stringify({ error: error.message });
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
      description: "Create a new order in the system after collecting all required info",
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
      description: "Save a qualified lead to the database",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          contact_person: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          lead_score: { type: "number", description: "0-100" },
          country: { type: "string" },
        },
        required: ["company_name"],
      },
    },
  },
];

// ── Agent prompts ────────────────────────────────────────
const AGENT_PROMPTS: Record<string, string> = {
  pricing: `You are a pharmaceutical pricing specialist at MedSource International.
Use search_product and calculate_price tools to look up real prices from the catalog.
BULK DISCOUNTS: 5% above 200 boxes, 10% above 500 boxes. MIN ORDER VALUE: $500 USD.
Always ask for company name and country before quoting. Show breakdowns. Keep replies concise (WhatsApp style). Never make medical claims.`,

  faq: `You are a product information expert at MedSource International.
SHIPPING: UAE/Saudi Arabia/Nigeria/Kenya/Philippines: 7-10 days. Other: 14-21 days. All tracked.
LICENSING: Valid pharmaceutical import license required. GMP-certified. WHO-prequalified available.
PAYMENT: Wire transfer, L/C. 50% advance for new customers. Net 30 for established accounts.
Be helpful and precise. Keep concise for WhatsApp.`,

  order: `You are an order collection specialist at MedSource International.
Use search_product to verify products and calculate_price for totals. When all info is collected, use create_order tool.
Collect: 1) Products & qty 2) Company name 3) Delivery address/country 4) Contact person 5) Phone/email 6) License number.
Min order $500. Be thorough but efficient. Format summaries clearly for WhatsApp.`,

  qualifier: `You are a B2B lead qualifier at MedSource International.
Qualify: 1) Company type 2) Country 3) License status 4) Monthly volume 5) Current suppliers 6) Product interests.
When qualified, use create_lead tool to save. Score: Licensed distributor=80, Hospital chain=60, Single pharmacy=40, No license=10.
Be warm, qualify naturally.`,

  greeting: `You are Aria, the friendly AI sales assistant for MedSource International.
Greet warmly. Briefly mention you can help with: pricing/quotes, shipping/licensing info, placing orders, buyer qualification.
Keep it short. Use a friendly emoji. Ask how you can help.`,
};

// ── Intent classification ────────────────────────────────
const CLASSIFIER_PROMPT = `You are an intent classifier for MedSource International, a pharmaceutical B2B export company.
Classify the intent: PRICING, FAQ, ORDER, QUALIFICATION, ESCALATE, GREETING. If unsure, default to FAQ.`;

async function classifyIntent(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<{ intent: string; confidence: number; entities: Record<string, unknown> }> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: CLASSIFIER_PROMPT }, ...messages.slice(-6)],
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
              entities: {
                type: "object",
                properties: {
                  product_names: { type: "array", items: { type: "string" } },
                  quantities: { type: "array", items: { type: "number" } },
                  company_name: { type: "string" },
                  country: { type: "string" },
                },
              },
            },
            required: ["intent", "confidence", "entities"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "classify_intent" } },
    }),
  });
  if (!resp.ok) return { intent: "FAQ", confidence: 0.5, entities: {} };
  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (tc?.function?.arguments) {
    try { return JSON.parse(tc.function.arguments); } catch { /* fallback */ }
  }
  return { intent: "FAQ", confidence: 0.5, entities: {} };
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
    case "calculate_price": return calculatePriceTool(args.base_price, args.quantity, args.currency || "USD");
    case "create_order": return await createOrderTool({ ...args, conversation_id: conversationId });
    case "create_lead": return await createLeadTool({ ...args, conversation_id: conversationId });
    default: return JSON.stringify({ error: "Unknown tool" });
  }
}

// ── Get AI response (non-streaming for WhatsApp) ─────────
async function getAIResponse(
  agent: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  conversationId?: string
): Promise<string> {
  const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.faq;
  const useTools = ["pricing", "order", "qualifier"].includes(agent);

  let agentMessages: any[] = [{ role: "system", content: systemPrompt }, ...messages];
  let maxIterations = 5;

  while (maxIterations-- > 0) {
    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: agentMessages,
    };
    if (useTools) body.tools = ALL_TOOLS;

    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.error("AI error:", resp.status);
      return "Sorry, I'm having trouble right now. Please try again in a moment.";
    }

    const data = await resp.json();
    const choice = data.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return choice?.message?.content || "I'm not sure how to respond to that.";
    }

    // Execute tool calls and continue loop
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

  // Final call without tools to get text response
  const finalResp = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: agentMessages }),
  });
  if (!finalResp.ok) return "Sorry, I'm having trouble right now.";
  const finalData = await finalResp.json();
  return finalData.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";
}

// ── Send WhatsApp message via Meta Cloud API ─────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) {
    console.error("WhatsApp credentials not configured");
    return false;
  }

  // WhatsApp has a 4096 char limit per text message — split if needed
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 4000) {
    const splitAt = remaining.lastIndexOf('\n', 4000);
    const breakPoint = splitAt > 2000 ? splitAt : 4000;
    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint).trim();
  }
  if (remaining) chunks.push(remaining);

  for (const chunk of chunks) {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: chunk },
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.text();
      console.error("WhatsApp send error:", resp.status, err);
      return false;
    }
  }
  return true;
}

// ── Find or create conversation ──────────────────────────
async function getOrCreateConversation(phone: string) {
  const sb = getSupabase();

  // Try to find existing active conversation
  const { data: existing } = await sb
    .from("conversations")
    .select("*")
    .eq("phone_number", phone)
    .eq("conversation_state", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  // Create new conversation
  const { data: created, error } = await sb
    .from("conversations")
    .insert({
      phone_number: phone,
      messages: [],
      current_agent: "greeting",
      conversation_state: "active",
      lead_score: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create conversation:", error);
    throw error;
  }
  return created;
}

// ── Update conversation in DB ────────────────────────────
async function updateConversation(id: string, messages: any[], agent: string) {
  const sb = getSupabase();
  await sb.from("conversations").update({
    messages,
    current_agent: agent,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
}

// ── Log analytics ────────────────────────────────────────
async function logEvent(eventType: string, eventData: Record<string, unknown>) {
  const sb = getSupabase();
  await sb.from("analytics_events").insert({ event_type: eventType, event_data: eventData });
}

// ── Main handler ─────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: Meta webhook verification ─────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming WhatsApp messages ───────────────────
  if (req.method === "POST") {
    try {
      const rawBody = await req.text();

      // Verify X-Hub-Signature-256 if app secret is configured
      const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
      if (appSecret) {
        const signature = req.headers.get("x-hub-signature-256");
        if (signature) {
          const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(appSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
          const expected = "sha256=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
          if (expected !== signature) {
            console.error("Invalid webhook signature");
            return new Response("Invalid signature", { status: 403 });
          }
        }
      }

      const body = JSON.parse(rawBody);

      // Meta sends various webhook events — we only care about messages
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Check if this is a message event (not status update etc.)
      if (!value?.messages || value.messages.length === 0) {
        // Could be a status update — acknowledge it
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = value.messages[0];
      const from = message.from; // phone number without +
      const messageText = message.text?.body;

      if (!messageText) {
        // Non-text message (image, audio, etc.) — acknowledge
        await sendWhatsAppMessage(from, "I can only process text messages at the moment. Please type your question! 😊");
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`📩 WhatsApp from ${from}: ${messageText}`);

      // Get or create conversation
      const conversation = await getOrCreateConversation(from);
      const existingMessages = (conversation.messages as any[]) || [];

      // Build message history for AI
      const aiHistory = existingMessages.map((m: any) => ({
        role: m.role as string,
        content: m.content as string,
      }));
      aiHistory.push({ role: "user", content: messageText });

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      // Classify intent
      const classification = await classifyIntent(aiHistory.slice(-10), LOVABLE_API_KEY);
      const agent = intentToAgent(classification.intent);
      console.log(`🤖 Intent: ${classification.intent} → Agent: ${agent}`);

      // Handle escalation
      let aiResponse: string;
      if (agent === "escalate") {
        aiResponse = "I understand this needs special attention. Let me connect you with our team.\n\n📞 Contact: +971-4-XXX-XXXX\n📧 Email: sales@medsource.com\n\nA team member will reach out within 24 hours.";
      } else {
        aiResponse = await getAIResponse(agent, aiHistory.slice(-10), LOVABLE_API_KEY, conversation.id);
      }

      // Save messages to conversation
      const updatedMessages = [
        ...existingMessages,
        { role: "user", content: messageText, timestamp: new Date().toISOString() },
        { role: "assistant", content: aiResponse, agent_role: agent, timestamp: new Date().toISOString() },
      ];
      await updateConversation(conversation.id, updatedMessages, agent);

      // Send reply via WhatsApp
      const sent = await sendWhatsAppMessage(from, aiResponse);
      console.log(`📤 Reply sent: ${sent}`);

      // Log analytics
      await logEvent("whatsapp_message", {
        phone: from,
        intent: classification.intent,
        agent,
        conversation_id: conversation.id,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Webhook error:", e);
      // Always return 200 to Meta to avoid retries
      return new Response(JSON.stringify({ status: "error", message: String(e) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
