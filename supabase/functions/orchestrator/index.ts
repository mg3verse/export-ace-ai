import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ── Intent classification prompt ───────────────────────
const CLASSIFIER_PROMPT = `You are an intent classifier for MedSource International, a pharmaceutical B2B export company.
Analyze the user message and conversation context. Classify the intent.

INTENTS:
- PRICING: product prices, quotes, bulk discounts, cost comparisons
- FAQ: shipping, licensing, regulations, product info, company details
- ORDER: place, modify, track, or cancel an order
- QUALIFICATION: new buyer, company details, license verification, volume inquiries
- ESCALATE: complaints, legal issues, returns, anything needing human judgment
- GREETING: hello, hi, general chat, small talk

If unsure, default to FAQ.`;

// ── Agent system prompts ───────────────────────────────
const AGENT_PROMPTS: Record<string, string> = {
  pricing: `You are a pharmaceutical pricing specialist at MedSource International.

PRODUCT CATALOG:
- Amoxicillin 500mg (AMX500): $12/box of 100, min 50 boxes
- Paracetamol 500mg (PCM500): $8/box of 100, min 100 boxes
- Metformin 850mg (MET850): $15/box of 60, min 50 boxes
- Azithromycin 250mg (AZI250): $22/box of 6, min 100 boxes
- Omeprazole 20mg (OMP020): $18/box of 28, min 50 boxes
- Ibuprofen 400mg (IBU400): $10/box of 50, min 100 boxes
- Ciprofloxacin 500mg (CIP500): $25/box of 10, min 50 boxes
- Losartan 50mg (LOS050): $14/box of 30, min 50 boxes
- Cetirizine 10mg (CET010): $6/box of 30, min 200 boxes
- Doxycycline 100mg (DOX100): $20/box of 8, min 100 boxes

BULK DISCOUNTS: 5% above 200 boxes, 10% above 500 boxes.
MIN ORDER VALUE: $500 USD.

Always ask for company name and country before quoting. Show breakdowns. Keep replies concise (WhatsApp style). Never make medical claims.`,

  faq: `You are a product information expert at MedSource International.

SHIPPING: UAE/Saudi Arabia/Nigeria/Kenya/Philippines: 7-10 days. Other: 14-21 days. All tracked.
LICENSING: Valid pharmaceutical import license required. GMP-certified. WHO-prequalified available.
PAYMENT: Wire transfer, L/C. 50% advance for new customers. Net 30 for established accounts.

Be helpful and precise. If unsure say "Let me get our team to confirm that." Never make medical claims. Keep concise.`,

  order: `You are an order collection specialist at MedSource International.

Collect: 1) Products & qty 2) Company name 3) Delivery address/country 4) Contact person 5) Phone/email 6) License number.
Min order $500. Check min quantities. Calculate totals with bulk discounts (5% >200 boxes, 10% >500 boxes).
Be thorough but efficient. Double-check totals. Format summaries clearly.`,

  qualifier: `You are a B2B lead qualifier at MedSource International.

Qualify: 1) Company type 2) Country 3) License status 4) Monthly volume 5) Current suppliers 6) Product interests.
Scoring: Licensed distributor = High, Hospital chain = Medium, Single pharmacy = Standard, No license = Cannot proceed.
Be warm, don't pressure, qualify naturally. Offer to connect with sales team for qualified leads.`,

  greeting: `You are Aria, the friendly AI sales assistant for MedSource International, a pharmaceutical B2B export company.

Greet the user warmly. Briefly introduce yourself and what you can help with:
- Product pricing and quotes
- Shipping and licensing info
- Placing orders
- Getting qualified as a buyer

Keep it short and inviting. Use a friendly emoji or two. Ask how you can help today.`,
};

// ── Classify intent via tool calling ───────────────────
async function classifyIntent(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<{ intent: string; confidence: number; entities: Record<string, unknown> }> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: CLASSIFIER_PROMPT },
        ...messages.slice(-6),
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_intent",
            description: "Classify the user's intent from the conversation",
            parameters: {
              type: "object",
              properties: {
                intent: {
                  type: "string",
                  enum: ["PRICING", "FAQ", "ORDER", "QUALIFICATION", "ESCALATE", "GREETING"],
                },
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
        },
      ],
      tool_choice: { type: "function", function: { name: "classify_intent" } },
    }),
  });

  if (!resp.ok) {
    console.error("Classification failed:", resp.status);
    return { intent: "FAQ", confidence: 0.5, entities: {} };
  }

  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse classification result");
    }
  }
  return { intent: "FAQ", confidence: 0.5, entities: {} };
}

// ── Map intent to agent ────────────────────────────────
function intentToAgent(intent: string): string {
  const map: Record<string, string> = {
    PRICING: "pricing",
    FAQ: "faq",
    ORDER: "order",
    QUALIFICATION: "qualifier",
    ESCALATE: "escalate",
    GREETING: "greeting",
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

    // Step 3: Get agent response (streaming)
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.faq;

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Agent error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Prepend meta event to the stream
    const metaEvent = `data: ${JSON.stringify({
      type: "meta",
      data: {
        intent: classification.intent,
        confidence: classification.confidence,
        agent,
        entities: classification.entities,
      },
    })}\n\n`;

    const metaBytes = new TextEncoder().encode(metaEvent);
    const agentStream = response.body!;

    // Combine meta + agent stream
    const combinedStream = new ReadableStream({
      async start(controller) {
        // Send meta first
        controller.enqueue(metaBytes);

        // Then pipe agent stream
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
