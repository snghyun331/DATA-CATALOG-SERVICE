import apiClient from '../apiClient';

export const DatabaseApi = {
  getDbStats: (dbName: string) => apiClient.get(`databases/${dbName}/stats`),
  getDbCatalog: (dbName: string) => apiClient.get(`databases/${dbName}`),
  getTableStats: (dbName: string, tableName: string) => apiClient.get(`databases/${dbName}/tables/${tableName}/stats`),
  getTableCatalog: (dbName: string, tableName: string) => apiClient.get(`databases/${dbName}/tables/${tableName}`),

  postDatabase: (data: any) => apiClient.post('databases/db', data),

  updateTableDescription: (dbName: string, tableName: string, description: string) =>
    apiClient.patch(`databases/${dbName}/tables/${tableName}/description`, { description }), // body로 전송

  updateColumnNote: (dbName: string, tableName: string, columnName: string, note: string) =>
    apiClient.patch(`databases/${dbName}/tables/${tableName}/columns/${columnName}/note`, { note }), // body로 전송

  checkDatabaseDiff: (dbName: string) => apiClient.get(`databases/${dbName}/diff`),
};
