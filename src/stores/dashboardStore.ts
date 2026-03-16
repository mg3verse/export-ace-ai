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

interface DashboardData {
  totalRevenue: number;
  activeLeads: number;
  conversionRate: number;
  pendingOrders: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  leadsByCountry: { country: string; count: number }[];
  recentOrders: DashboardOrder[];
}

interface DashboardState {
  data: DashboardData;
  isLoading: boolean;
  fetchData: () => Promise<void>;
  refreshData: () => void;
}

const EMPTY: DashboardData = {
  totalRevenue: 0,
  activeLeads: 0,
  conversionRate: 0,
  pendingOrders: 0,
  revenueByMonth: [],
  leadsByCountry: [],
  recentOrders: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: EMPTY,
  isLoading: true,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [ordersRes, leadsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*'),
      ]);

      const orders = (ordersRes.data ?? []) as unknown as DashboardOrder[];
      const leads = (leadsRes.data ?? []) as any[];

      const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const qualifiedLeads = leads.filter((l) => l.status !== 'new').length;
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const conversionRate = leads.length > 0 ? Math.round((qualifiedLeads / leads.length) * 100) : 0;

      // Revenue by month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthMap: Record<string, { revenue: number; orders: number }> = {};
      for (const o of orders) {
        const key = monthNames[new Date(o.created_at).getMonth()];
        if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
        monthMap[key].revenue += Number(o.total_amount);
        monthMap[key].orders += 1;
      }
      const revenueByMonth = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));

      // Leads by company (using company_name as proxy since no country field)
      const companyMap: Record<string, number> = {};
      for (const l of leads) {
        companyMap[l.company_name] = (companyMap[l.company_name] ?? 0) + 1;
      }
      const leadsByCountry = Object.entries(companyMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      set({
        data: {
          totalRevenue,
          activeLeads: qualifiedLeads,
          conversionRate,
          pendingOrders,
          revenueByMonth,
          leadsByCountry,
          recentOrders: orders.slice(0, 10),
        },
        isLoading: false,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      set({ isLoading: false });
    }
  },

  refreshData: () => {
    get().fetchData();
  },
}));
