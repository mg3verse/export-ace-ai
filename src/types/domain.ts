export type AgentRole = 'pricing' | 'faq' | 'order' | 'qualifier' | 'orchestrator' | 'greeting';

export interface Product {
  id: string;
  sku: string;
  name: string;
  dosage: string;
  pricePerBox: number;
  unitsPerBox: number;
  minOrderQty: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  category: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  country: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  isQualified: boolean;
  tier: 'new' | 'qualified' | 'active' | 'vip';
  createdAt: string;
  lastContactAt: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  leadId: string;
  companyName: string;
  items: OrderItem[];
  totalValue: number;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentRole?: AgentRole;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  leadId?: string;
  leadName: string;
  status: 'active' | 'idle' | 'closed';
  messages: Message[];
  currentAgent: AgentRole;
  createdAt: string;
  lastMessageAt: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export interface DashboardData {
  totalRevenue: number;
  activeLeads: number;
  conversionRate: number;
  pendingOrders: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  leadsByCountry: { country: string; count: number }[];
  recentOrders: Order[];
}
