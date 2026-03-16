import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { DashboardData, Order, OrderItem } from '@/types/domain';

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
      const [ordersRes, leadsRes, orderItemsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*'),
        supabase.from('order_items').select('*'),
      ]);

      const orders = (ordersRes.data ?? []) as any[];
      const leads = (leadsRes.data ?? []) as any[];
      const orderItems = (orderItemsRes.data ?? []) as any[];

      // Map order items by order_id
      const itemsByOrder: Record<string, OrderItem[]> = {};
      for (const item of orderItems) {
        const oid = item.order_id;
        if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
        itemsByOrder[oid].push({
          productId: item.product_id,
          sku: item.sku,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          discount: Number(item.discount),
          lineTotal: Number(item.line_total),
        });
      }

      const mappedOrders: Order[] = orders.map((o) => ({
        id: o.id,
        leadId: o.lead_id ?? '',
        companyName: o.company_name,
        items: itemsByOrder[o.id] ?? [],
        totalValue: Number(o.total_value),
        status: o.status,
        shippingAddress: o.shipping_address ?? '',
        country: o.country,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }));

      const totalRevenue = mappedOrders.reduce((s, o) => s + o.totalValue, 0);
      const activeLeads = leads.filter((l: any) => l.is_qualified).length;
      const pendingOrders = mappedOrders.filter((o) => o.status === 'pending').length;
      const conversionRate = leads.length > 0 ? Math.round((activeLeads / leads.length) * 100) : 0;

      // Revenue by month from orders
      const monthMap: Record<string, { revenue: number; orders: number }> = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (const o of mappedOrders) {
        const d = new Date(o.createdAt);
        const key = monthNames[d.getMonth()];
        if (!monthMap[key]) monthMap[key] = { revenue: 0, orders: 0 };
        monthMap[key].revenue += o.totalValue;
        monthMap[key].orders += 1;
      }
      const revenueByMonth = Object.entries(monthMap).map(([month, v]) => ({ month, ...v }));

      // Leads by country
      const countryMap: Record<string, number> = {};
      for (const l of leads) {
        countryMap[l.country] = (countryMap[l.country] ?? 0) + 1;
      }
      const leadsByCountry = Object.entries(countryMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      set({
        data: {
          totalRevenue,
          activeLeads,
          conversionRate,
          pendingOrders,
          revenueByMonth,
          leadsByCountry,
          recentOrders: mappedOrders.slice(0, 10),
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
