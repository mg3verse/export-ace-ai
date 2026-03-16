import { supabase } from '@/integrations/supabase/client';
import type { DbProduct, DbConversation, DbOrder, DbLead, DbAnalyticsEvent } from '@/types/database';

// ── Products ────────────────────────────────────────────

export async function getProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return (data ?? []) as unknown as DbProduct[];
}

export async function getProductBySkuOrName(query: string): Promise<DbProduct | null> {
  const term = query.trim();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`sku.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(1);
  if (error) throw new Error(`Product search failed: ${error.message}`);
  return ((data ?? [])[0] as unknown as DbProduct) ?? null;
}

// ── Conversations ───────────────────────────────────────

export async function createConversation(
  params: { phone_number?: string; session_id?: string } = {}
): Promise<DbConversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      phone_number: params.phone_number ?? null,
      session_id: params.session_id ?? null,
      messages: [],
      current_agent: 'qualifier',
      conversation_state: 'active',
      lead_score: 0,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data as unknown as DbConversation;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<DbConversation, 'messages' | 'current_agent' | 'conversation_state' | 'lead_score'>>
): Promise<DbConversation> {
  const { data, error } = await supabase
    .from('conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update conversation: ${error.message}`);
  return data as unknown as DbConversation;
}

// ── Orders ──────────────────────────────────────────────

export async function createOrder(params: {
  conversation_id?: string;
  customer_name: string;
  products: { sku: string; name: string; quantity: number; unit_price: number; line_total: number }[];
  total_amount: number;
  delivery_address?: string;
}): Promise<DbOrder> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      conversation_id: params.conversation_id ?? null,
      customer_name: params.customer_name,
      products: params.products as any,
      total_amount: params.total_amount,
      delivery_address: params.delivery_address ?? null,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create order: ${error.message}`);
  return data as unknown as DbOrder;
}

// ── Leads ───────────────────────────────────────────────

export async function createLead(params: {
  conversation_id?: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  lead_score?: number;
  qualification_data?: Record<string, unknown>;
}): Promise<DbLead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      conversation_id: params.conversation_id ?? null,
      company_name: params.company_name,
      contact_person: params.contact_person ?? null,
      email: params.email ?? null,
      phone: params.phone ?? null,
      lead_score: params.lead_score ?? 0,
      qualification_data: (params.qualification_data ?? {}) as any,
      status: 'new',
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  return data as unknown as DbLead;
}

// ── Analytics ───────────────────────────────────────────

export async function logAnalyticsEvent(
  event_type: string,
  event_data: Record<string, unknown> = {}
): Promise<DbAnalyticsEvent> {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({ event_type, event_data: event_data as any })
    .select()
    .single();
  if (error) throw new Error(`Failed to log event: ${error.message}`);
  return data as unknown as DbAnalyticsEvent;
}
