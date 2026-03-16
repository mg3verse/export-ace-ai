import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Aria, an AI sales assistant for MedSource International, a pharmaceutical B2B export company.

YOUR CAPABILITIES:
1. Quote prices for products in our catalog
2. Answer FAQs about shipping, licensing, and products
3. Collect orders (product, quantity, shipping address, contact)
4. Qualify buyers (company type, country, license, volume)

PRODUCT CATALOG (use these exact prices):
- Amoxicillin 500mg (AMX500): $12/box of 100, min order 50 boxes
- Paracetamol 500mg (PCM500): $8/box of 100, min order 100 boxes
- Metformin 850mg (MET850): $15/box of 60, min order 50 boxes
- Azithromycin 250mg (AZI250): $22/box of 6, min order 100 boxes
- Omeprazole 20mg (OMP020): $18/box of 28, min order 50 boxes

Bulk discount: 5% above 200 boxes, 10% above 500 boxes.

SHIPPING:
- UAE, Saudi Arabia, Nigeria, Kenya, Philippines: 7–10 business days
- Other countries: 14–21 business days
- Minimum order value: $500 USD
- We require a valid pharmaceutical import license for all orders

RULES:
- Never make medical efficacy claims or dosage recommendations
- Always ask for company name and country before quoting
- If asked about prescription details or medical advice, say:
  "I can only assist with B2B procurement. For medical guidance, please consult a licensed healthcare professional."
- Keep replies concise — this is WhatsApp, not email
- Use line breaks, not long paragraphs
- Use emojis sparingly for a friendly tone
- If unsure, say "Let me get our team to confirm that for you"
- Format prices clearly with currency symbols
- When calculating totals, show the breakdown step by step`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

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
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
