import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface DashboardOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  products: any[];
  delivery_address: string | null;
  conversation_id: string | null;
}

interface ConversationRow {
  id: string;
  current_agent: string | null;
  conversation_state: string | null;
  lead_score: number | null;
  messages: any;
  created_at: string;
  updated_at: string;
}

interface LeadRow {
  id: string;
  company_name: string;
  lead_score: number | null;
  status: string;
  created_at: string;
}

export interface LiveFeedItem {
  id: string;
  agentType: string;
  customerName: string;
  action: string;
  value?: number;
  timestamp: string;
}

interface DashboardData {
  // KPI data
  totalConversations: number;
  todayConversations: number;
  yesterdayConversations: number;
  activeConversations: number;

  ordersCollected: number;
  todayOrders: number;
  avgOrderValue: number;
  orderConversionRate: number;

  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;

  avgLeadScore: number;
  highValueLeads: number;
  qualificationRate: number;

  // Chart data
  conversationsByAgent: { agent: string; count: number; color: string }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  leadsByQuality: { quality: string; count: number; color: string }[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  conversationActivity: { time: string; total: number; pricing: number; faq: number; order: number; qualifier: number }[];

  // Table & feed
  recentOrders: DashboardOrder[];
  liveFeed: LiveFeedItem[];
  leadsByCompany: { company: string; count: number }[];
}

interface DashboardState {
  data: DashboardData;
  isLoading: boolean;
  timeRange: 'today' | '7d' | '30d';
  agentFilter: 'all' | 'pricing' | 'faq' | 'order' | 'qualifier';
  setTimeRange: (r: 'today' | '7d' | '30d') => void;
  setAgentFilter: (f: 'all' | 'pricing' | 'faq' | 'order' | 'qualifier') => void;
  fetchData: () => Promise<void>;
  refreshData: () => void;
}

const EMPTY: DashboardData = {
  totalConversations: 0, todayConversations: 0, yesterdayConversations: 0, activeConversations: 0,
  ordersCollected: 0, todayOrders: 0, avgOrderValue: 0, orderConversionRate: 0,
  totalRevenue: 0, todayRevenue: 0, monthlyRevenue: 0,
  avgLeadScore: 0, highValueLeads: 0, qualificationRate: 0,
  conversationsByAgent: [], ordersByStatus: [], leadsByQuality: [], revenueByMonth: [], conversationActivity: [],
  recentOrders: [], liveFeed: [], leadsByCompany: [],
};

const AGENT_COLORS: Record<string, string> = {
  pricing: 'hsl(221, 83%, 53%)',
  faq: 'hsl(142, 71%, 45%)',
  order: 'hsl(262, 83%, 58%)',
  qualifier: 'hsl(32, 95%, 50%)',
  greeting: 'hsl(200, 60%, 50%)',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(45, 93%, 47%)',
  confirmed: 'hsl(221, 83%, 53%)',
  shipped: 'hsl(262, 83%, 58%)',
  delivered: 'hsl(142, 71%, 45%)',
  cancelled: 'hsl(0, 84%, 60%)',
};

const QUALITY_COLORS: Record<string, string> = {
  Hot: 'hsl(0, 84%, 60%)',
  Warm: 'hsl(32, 95%, 50%)',
  Cold: 'hsl(221, 83%, 53%)',
  Unqualified: 'hsl(220, 9%, 46%)',
};

function isToday(d: string) {
  return new Date(d).toDateString() === new Date().toDateString();
}
function isYesterday(d: string) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return new Date(d).toDateString() === y.toDateString();
}
function isWithinDays(d: string, days: number) {
  return Date.now() - new Date(d).getTime() < days * 86400000;
}

function classifyLeadQuality(score: number | null): string {
  if (!score || score <= 20) return 'Unqualified';
  if (score <= 50) return 'Cold';
  if (score <= 75) return 'Warm';
  return 'Hot';
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: EMPTY,
  isLoading: true,
  timeRange: 'today',
  agentFilter: 'all',

  setTimeRange: (r) => { set({ timeRange: r }); get().fetchData(); },
  setAgentFilter: (f) => { set({ agentFilter: f }); get().fetchData(); },

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [ordersRes, leadsRes, convsRes, eventsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*'),
        supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
        supabase.from('analytics_events').select('*').order('timestamp', { ascending: false }).limit(50),
      ]);

      const orders = (ordersRes.data ?? []) as unknown as DashboardOrder[];
      const leads = (leadsRes.data ?? []) as LeadRow[];
      const conversations = (convsRes.data ?? []) as unknown as ConversationRow[];
      const events = (eventsRes.data ?? []) as any[];

      // ── Conversations KPIs ──
      const todayConvs = conversations.filter(c => isToday(c.created_at));
      const yesterdayConvs = conversations.filter(c => isYesterday(c.created_at));
      const activeConvs = conversations.filter(c => c.conversation_state === 'active');

      // ── Orders KPIs ──
      const todayOrders = orders.filter(o => isToday(o.created_at));
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const orderConvRate = conversations.length > 0 ? Math.round((orders.length / conversations.length) * 100) : 0;

      // Monthly revenue
      const now = new Date();
      const monthlyOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const monthlyRevenue = monthlyOrders.reduce((s, o) => s + Number(o.total_amount), 0);

      // ── Lead KPIs ──
      const scores = leads.map(l => l.lead_score ?? 0);
      const avgLeadScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highValueLeads = leads.filter(l => (l.lead_score ?? 0) > 75).length;
      const qualifiedLeads = leads.filter(l => l.status !== 'new').length;
      const qualificationRate = leads.length > 0 ? Math.round((qualifiedLeads / leads.length) * 100) : 0;

      // ── Charts ──
      // Agent distribution
      const agentMap: Record<string, number> = {};
      conversations.forEach(c => {
        const a = c.current_agent || 'qualifier';
        agentMap[a] = (agentMap[a] ?? 0) + 1;
      });
      const conversationsByAgent = Object.entries(agentMap).map(([agent, count]) => ({
        agent: agent.charAt(0).toUpperCase() + agent.slice(1),
        count,
        color: AGENT_COLORS[agent] || 'hsl(220, 9%, 46%)',
      }));

      // Order status
      const statusMap: Record<string, number> = {};
      orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
      const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: STATUS_COLORS[status] || 'hsl(220, 9%, 46%)',
      }));

      // Lead quality
      const qualityMap: Record<string, number> = { Hot: 0, Warm: 0, Cold: 0, Unqualified: 0 };
      leads.forEach(l => { qualityMap[classifyLeadQuality(l.lead_score)] += 1; });
      const leadsByQuality = Object.entries(qualityMap).map(([quality, count]) => ({
        quality, count, color: QUALITY_COLORS[quality],
      }));

      // Revenue by month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mMap: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach(o => {
        const k = monthNames[new Date(o.created_at).getMonth()];
        if (!mMap[k]) mMap[k] = { revenue: 0, orders: 0 };
        mMap[k].revenue += Number(o.total_amount);
        mMap[k].orders += 1;
      });
      const revenueByMonth = Object.entries(mMap).map(([month, v]) => ({ month, ...v }));

      // Conversation activity (mock hourly for today)
      const hours = Array.from({ length: 24 }, (_, i) => {
        const h = `${i.toString().padStart(2, '0')}:00`;
        return { time: h, total: 0, pricing: 0, faq: 0, order: 0, qualifier: 0 };
      });
      todayConvs.forEach(c => {
        const hr = new Date(c.created_at).getHours();
        hours[hr].total += 1;
        const agent = (c.current_agent || 'qualifier') as keyof typeof hours[0];
        if (agent in hours[hr]) (hours[hr] as any)[agent] += 1;
      });
      const conversationActivity = hours.filter((_, i) => i <= new Date().getHours() + 1);

      // Live feed from recent events + orders
      const liveFeed: LiveFeedItem[] = [
        ...orders.slice(0, 5).map(o => ({
          id: o.id,
          agentType: 'Order Agent',
          customerName: o.customer_name,
          action: `Order collected: $${Number(o.total_amount).toLocaleString()}`,
          value: Number(o.total_amount),
          timestamp: o.created_at,
        })),
        ...events.slice(0, 5).map(e => ({
          id: e.id,
          agentType: e.event_type === 'pricing_search' ? 'Pricing Agent' : e.event_type === 'faq_search' ? 'FAQ Agent' : 'System',
          customerName: (e.event_data as any)?.query || 'Unknown',
          action: `${e.event_type}: ${JSON.stringify(e.event_data).slice(0, 60)}`,
          timestamp: e.timestamp,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Leads by company
      const compMap: Record<string, number> = {};
      leads.forEach(l => { compMap[l.company_name] = (compMap[l.company_name] ?? 0) + 1; });
      const leadsByCompany = Object.entries(compMap).map(([company, count]) => ({ company, count })).sort((a, b) => b.count - a.count);

      set({
        data: {
          totalConversations: conversations.length,
          todayConversations: todayConvs.length,
          yesterdayConversations: yesterdayConvs.length,
          activeConversations: activeConvs.length,
          ordersCollected: orders.length,
          todayOrders: todayOrders.length,
          avgOrderValue: Math.round(avgOrderValue),
          orderConversionRate: orderConvRate,
          totalRevenue, todayRevenue, monthlyRevenue,
          avgLeadScore, highValueLeads, qualificationRate,
          conversationsByAgent, ordersByStatus, leadsByQuality, revenueByMonth, conversationActivity,
          recentOrders: orders.slice(0, 10),
          liveFeed,
          leadsByCompany,
        },
        isLoading: false,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      set({ isLoading: false });
    }
  },

  refreshData: () => { get().fetchData(); },
}));
