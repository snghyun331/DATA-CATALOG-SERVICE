import apiClient from '../apiClient';

export const DatabaseApi = {
  getDbStats: (dbName: string) => apiClient.get(`databases/${dbName}/stats`),
  getDbCatalog: (dbName: string) => apiClient.get(`databases/${dbName}`),
};
