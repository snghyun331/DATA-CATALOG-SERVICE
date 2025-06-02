import apiClient from '../apiClient';

export const DashboardApi = {
  getOverview: () => apiClient.get('dashboard/overview'),
};
