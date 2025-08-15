import { useQuery } from '@tanstack/react-query';
import { DashboardApi } from '../api/dashboard/dashboard.api';
import apiClient from '../api/apiClient';

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: DashboardApi.getOverview,
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => apiClient.get('/company'),
  });
};
