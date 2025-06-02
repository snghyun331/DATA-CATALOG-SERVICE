import { useQuery } from '@tanstack/react-query';
import { DashboardApi } from '../api/dashboard/dashboard.api';

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: DashboardApi.getOverview,
  });
};
