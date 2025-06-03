import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useAddDatabase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DatabaseApi.postDatabase,
    onSuccess: () => {
      // 성공시 대시보드 데이터 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    // retry를 비활성화해서 빠른 에러 처리
    retry: false,
  });
};

export const useTableDescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dbName, tableName, description }: { dbName: string; tableName: string; description: string }) =>
      DatabaseApi.updateTableDescription(dbName, tableName, description),
    onSuccess: (_, variables) => {
      // 성공시 해당 DB의 테이블 목록 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['database-catalog', variables.dbName] });
    },
  });
};
