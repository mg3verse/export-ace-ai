export interface DbProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price_usd: number;
  stock_quantity: number;
  description: string | null;
  specifications: Record<string, unknown>;
  created_at: string;
}

export interface DbConversation {
  id: string;
  phone_number: string | null;
  session_id: string | null;
  messages: DbMessage[];
  current_agent: string;
  conversation_state: string;
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_role?: string;
  timestamp: string;
}

export interface DbOrder {
  id: string;
  conversation_id: string | null;
  customer_name: string;
  products: DbOrderProduct[];
  total_amount: number;
  delivery_address: string | null;
  status: string;
  created_at: string;
}

export interface DbOrderProduct {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface DbLead {
  id: string;
  conversation_id: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  lead_score: number;
  qualification_data: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface DbAnalyticsEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  timestamp: string;
}
