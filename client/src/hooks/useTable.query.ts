import { useQuery } from '@tanstack/react-query';
import { DatabaseApi } from '../api/database/database.api';

export const useTableStats = (dbName: string, tableName: string) => {
  return useQuery({
    queryKey: ['table-stats', { dbName, tableName }],
    queryFn: () => DatabaseApi.getTableStats(dbName, tableName),
  });
};

export const useTableCatalog = (dbName: string, tableName: string) => {
  return useQuery({
    queryKey: ['table-catalog', { dbName, tableName }],
    queryFn: () => DatabaseApi.getTableCatalog(dbName, tableName),
  });
};
