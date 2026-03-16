import { create } from 'zustand';
import { DashboardData } from '@/types/domain';
import { DASHBOARD_DATA } from '@/data/sampleData';

interface DashboardState {
  data: DashboardData;
  isLoading: boolean;
  refreshData: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: DASHBOARD_DATA,
  isLoading: false,
  refreshData: () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 800);
  },
}));
