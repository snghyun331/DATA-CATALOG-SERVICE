import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useUpdateColumnNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dbName,
      tableName,
      columnName,
      note,
    }: {
      dbName: string;
      tableName: string;
      columnName: string;
      note: string;
    }) => DatabaseApi.updateColumnNote(dbName, tableName, columnName, note),
    onSuccess: (_, variables) => {
      // 성공시 해당 테이블의 컬럼 목록 다시 가져오기
      queryClient.invalidateQueries({
        queryKey: ['table-catalog', { dbName: variables.dbName, tableName: variables.tableName }],
      });
    },
  });
};
