import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mask(v: string | undefined, keep = 4): string | null {
  if (!v) return null;
  if (v.length <= keep) return "•".repeat(v.length);
  return "•".repeat(Math.max(4, v.length - keep)) + v.slice(-keep);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    // Verify token validity by hitting Meta Graph API
    let tokenValid = false;
    let phoneInfo: { display_phone_number?: string; verified_name?: string } | null = null;
    let tokenError: string | null = null;

    if (accessToken && phoneNumberId) {
      try {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number,verified_name`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (r.ok) {
          tokenValid = true;
          phoneInfo = await r.json();
        } else {
          const err = await r.json().catch(() => ({}));
          tokenError = err?.error?.message ?? `HTTP ${r.status}`;
        }
      } catch (e) {
        tokenError = (e as Error).message;
      }
    }

    // Recent webhook events (use conversations as proxy for inbound messages)
    const sb = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: recent } = await sb
      .from("conversations")
      .select("id, phone_number, current_agent, conversation_state, updated_at, messages")
      .order("updated_at", { ascending: false })
      .limit(8);

    const events = (recent ?? []).map((c: any) => {
      const msgs = Array.isArray(c.messages) ? c.messages : [];
      const last = msgs[msgs.length - 1] ?? null;
      return {
        id: c.id,
        phone: c.phone_number ? mask(c.phone_number, 4) : null,
        agent: c.current_agent,
        state: c.conversation_state,
        updatedAt: c.updated_at,
        lastRole: last?.role ?? null,
        preview: typeof last?.content === "string" ? last.content.slice(0, 80) : null,
      };
    });

    return new Response(
      JSON.stringify({
        config: {
          accessTokenSet: !!accessToken,
          phoneNumberIdSet: !!phoneNumberId,
          verifyTokenSet: !!verifyToken,
          appSecretSet: !!appSecret,
          phoneNumberId: mask(phoneNumberId, 4),
        },
        webhookUrl,
        verification: {
          tokenValid,
          tokenError,
          displayPhoneNumber: phoneInfo?.display_phone_number ?? null,
          verifiedName: phoneInfo?.verified_name ?? null,
        },
        recentEvents: events,
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
