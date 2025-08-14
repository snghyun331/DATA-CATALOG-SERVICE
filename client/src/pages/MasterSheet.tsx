import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Database, FileText, HardDrive, Clock } from 'lucide-react';
import { useDatabaseCatalog, useDatabaseDiff, useDatabaseStats, useTableDescription } from '../hooks/useDatabase.query';
import EditableDescription from './EditDescription';
import DatabaseDiff from '../components/DatabaseDiff';
import { useQueryClient } from '@tanstack/react-query';

interface TableData {
  tableName: string;
  columns: number;
  records: string;
  size: string;
  description: string;
  comment: string;
}

const MasterSheet: React.FC = () => {
  const { dbName } = useParams<{ dbName: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // 이 줄 추가

  // API 호출
  const { data: databaseStats, isLoading: statsLoading, error: statsError } = useDatabaseStats(dbName!);
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useDatabaseCatalog(dbName!);
  const updateDescriptionMutation = useTableDescription();
  const { data: diffData, isLoading: diffLoading } = useDatabaseDiff(dbName!);
  // const updateSchemaMutation = useUpdateDatabaseSchema();

  const [isDismissed, setIsDismissed] = useState(false);

  // 로딩 상태
  if (statsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading database information...</div>
      </div>
    );
  }

  const handleUpdateDescription = (tableName: string, newDescription: string) => {
    updateDescriptionMutation.mutate({
      dbName: dbName!,
      tableName,
      description: newDescription,
    });
  };

  const handleDismissNotification = () => {
    setIsDismissed(true);
  };

  const handleUpdateSchema = () => {
    // updateSchemaMutation.mutate(dbName!, {
    //   onSuccess: () => {
    //     setIsDismissed(true);
    //   },
    //   onError: (error) => {
    //     console.error('Schema update failed:', error);
    //   },
    // });
    // 실제 업데이트 API가 없다면 단순히 diff 데이터만 새로고침
    queryClient.invalidateQueries({ queryKey: ['database-diff', dbName] });
    queryClient.invalidateQueries({ queryKey: ['database-catalog', dbName] });
    setIsDismissed(true);
  };

  // MasterSheet.tsx의 hasTableChanges 함수 수정
  const hasTableChanges = (tableName: string) => {
    if (!diffData?.data) return false;

    const diff = diffData.data;
    return (
      diff.tables.added.some((item: any) => item.table === tableName) ||
      diff.tables.deleted.some((item: any) => item.table === tableName) ||
      diff.columns.added.some((item: any) => item.table === tableName) ||
      diff.columns.deleted.some((item: any) => item.table === tableName) ||
      diff.columns.updated.some((item: any) => item.table === tableName)
    );
  };

  const dbStats = databaseStats?.data;
  const rawTablesData = tablesData?.data || [];

  // API 응답을 TableData 형태로 변환
  const masterSheetData: TableData[] = rawTablesData.map((table: any) => ({
    tableName: table.TABLE_NAME,
    columns: table.TABLE_COLUMNS,
    records: table.TABLE_ROWS,
    size: `${table.DATA_SIZE} MB`,
    description: table.TABLE_DESCRIPTION,
    comment: table.TABLE_COMMENT,
  }));

  const handleBack = (): void => {
    navigate('/home');
  };

  const handleTableClick = (tableName: string): void => {
    navigate(`/database/${dbName}/table/${tableName}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <div>
              <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-gray-500">
                <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="sr-only">Home</span>
              </button>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <button
                onClick={() => navigate('/home')}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Databases
              </button>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-900">{dbStats.dbName}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Database Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{dbStats.dbName}</h2>
              <p className="text-sm text-gray-500">Database Overview</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                dbStats.dbTag === 'production' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {dbStats.dbTag}
            </span>
          </div>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            ← Back to Home
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Table className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-blue-600 mb-1">Total Tables</div>
                <div className="text-2xl font-bold text-blue-900">{dbStats.tableCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-green-600 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-green-900">{Number(dbStats.rows).toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-purple-600 mb-1">Total Size</div>
                <div className="text-2xl font-bold text-purple-900">{dbStats.dbSize} MB</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-orange-600 mb-1">Last Update</div>
                <div className="text-2xl font-bold text-orange-900">
                  {dbStats.lastUpdated
                    ? new Date(dbStats.lastUpdated).toLocaleDateString('sv-SE').replace(/-/g, '.')
                    : 'No Updates'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900">Tables ({masterSheetData.length})</h3>

            {/* Database Diff Component */}
            {diffData?.data && !isDismissed && (
              <DatabaseDiff
                isVisible={diffData.data.changed}
                diffData={diffData.data}
                onUpdate={handleUpdateSchema}
                onDismiss={handleDismissNotification}
                // isUpdating={updateSchemaMutation.isPending}
                isUpdating={false}
              />
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Columns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {masterSheetData.map((table, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    hasTableChanges(table.tableName) ? 'bg-amber-25 border-l-2 border-l-amber-300' : ''
                  }`}
                  onClick={() => handleTableClick(table.tableName)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Table className="mr-3 text-blue-500" size={16} />
                      <span className="font-medium text-gray-900">{table.tableName}</span>
                      {hasTableChanges(table.tableName) && (
                        <div
                          className="ml-2 w-1.5 h-1.5 bg-amber-500 rounded-full"
                          title="This table has changes"
                        ></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.columns}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.records}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.comment}</td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                    <EditableDescription
                      value={table.description}
                      onSave={(newDescription) => handleUpdateDescription(table.tableName, newDescription)}
                      isLoading={updateDescriptionMutation.isPending}
                      placeholder=""
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;
