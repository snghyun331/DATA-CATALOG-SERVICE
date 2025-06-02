import { useQuery } from '@tanstack/react-query';
import { DatabaseApi } from '../api/database/database.api';

export const useDatabaseStats = (dbName: string) => {
  return useQuery({
    queryKey: ['database-stats', dbName],
    queryFn: () => DatabaseApi.getDbStats(dbName),
  });
};

export const useDatabaseCatalog = (dbName: string) => {
  return useQuery({
    queryKey: ['database-catalog', dbName],
    queryFn: () => DatabaseApi.getDbCatalog(dbName),
  });
};
