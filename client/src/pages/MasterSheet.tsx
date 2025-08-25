import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Database, FileText, HardDrive, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useDatabaseCatalog, useDatabaseStats, useTableDescription } from '../hooks/useDatabase.query';
import { useCompanies } from '../hooks/useDashboard.query';
import { useQueryClient } from '@tanstack/react-query';
import EditableDescription from './EditDescription';
import apiClient from '../api/apiClient';

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
  // API 호출
  const { data: databaseStats, isLoading: statsLoading, error: statsError } = useDatabaseStats(dbName!);
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useDatabaseCatalog(dbName!);
  const updateDescriptionMutation = useTableDescription();
  const { data: companiesData } = useCompanies();
  const queryClient = useQueryClient();

  // 변화 감지 상태
  const [hasChanges, setHasChanges] = useState(false);
  const [isCheckingChanges, setIsCheckingChanges] = useState(false);
  const [changeDetails, setChangeDetails] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 변화 감지 확인
  useEffect(() => {
    const checkChanges = async () => {
      if (!dbName) return;

      setIsCheckingChanges(true);
      try {
        const response = await apiClient.get(`/databases/${dbName}/diff`);
        const diffData = response.data;
        setHasChanges(diffData.changed);
        setChangeDetails(diffData);
      } catch (error) {
        console.error(`Error checking changes for ${dbName}:`, error);
        setHasChanges(false);
      } finally {
        setIsCheckingChanges(false);
      }
    };

    checkChanges();
  }, [dbName]);

  // 수동 변화 감지 확인
  const handleRefreshChanges = async () => {
    if (!dbName) return;

    setIsCheckingChanges(true);
    try {
      const response = await apiClient.get(`/databases/${dbName}/diff`);
      const diffData = response.data;
      setHasChanges(diffData.changed);
      setChangeDetails(diffData);
    } catch (error) {
      console.error(`Error checking changes for ${dbName}:`, error);
    } finally {
      setIsCheckingChanges(false);
    }
  };

  // 카탈로그 업데이트
  const handleUpdateCatalog = async () => {
    if (!dbName) {
      return;
    }

    setIsUpdating(true);
    try {
      // 카탈로그 업데이트 - PUT /api/v1/databases/{dbName} with diffData
      console.log(`Calling PUT /databases/${dbName} with diffData:`, changeDetails);
      const updateResponse = await apiClient.put(`/databases/${dbName}`, {
        diffData: changeDetails,
      });
      console.log('Update response:', updateResponse);

      // 업데이트 후 관련 쿼리 무효화하여 새로고침
      await queryClient.invalidateQueries({ queryKey: ['database-catalog', dbName] });
      await queryClient.invalidateQueries({ queryKey: ['database-stats', dbName] });

      // 변화 감지 재확인
      const diffResponse = await apiClient.get(`/databases/${dbName}/diff`);
      const diffData = diffResponse.data;
      setHasChanges(diffData.changed);
      setChangeDetails(diffData);

      // 성공 알림
      console.log('카탈로그 업데이트가 완료되었습니다.');
    } catch (error) {
      console.error(`Error updating catalog for ${dbName}:`, error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsUpdating(false);
    }
  };

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
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Tables ({masterSheetData.length})</h3>
            {hasChanges && changeDetails && (
              <div className="flex items-center space-x-1 relative group">
                <AlertCircle className="text-orange-500 cursor-pointer" size={18} />
                <span className="text-orange-500 text-sm font-medium cursor-pointer">업데이트가 필요합니다!</span>

                {/* 툴팁 */}
                <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[300px]">
                  <div className="text-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">변화 감지 상세 내용</h4>

                    {/* 테이블 변화 */}
                    {(changeDetails.tables.added.length > 0 || changeDetails.tables.deleted.length > 0) && (
                      <div className="mb-3">
                        <h5 className="font-medium text-gray-700 mb-1">테이블 변화</h5>
                        {changeDetails.tables.added.length > 0 && (
                          <div className="text-green-600 text-xs">
                            • 추가된 테이블: {changeDetails.tables.added.length}개
                          </div>
                        )}
                        {changeDetails.tables.deleted.length > 0 && (
                          <div className="text-red-600 text-xs">
                            • 삭제된 테이블: {changeDetails.tables.deleted.length}개
                          </div>
                        )}
                      </div>
                    )}

                    {/* 컬럼 변화 */}
                    {(changeDetails.columns.added.length > 0 ||
                      changeDetails.columns.deleted.length > 0 ||
                      changeDetails.columns.updated.length > 0) && (
                      <div className="mb-3">
                        <h5 className="font-medium text-gray-700 mb-1">컬럼 변화</h5>
                        {changeDetails.columns.added.length > 0 && (
                          <div className="text-green-600 text-xs">
                            • 추가된 컬럼:{' '}
                            {changeDetails.columns.added.reduce((total, item) => total + item.columns.length, 0)}개
                          </div>
                        )}
                        {changeDetails.columns.deleted.length > 0 && (
                          <div className="text-red-600 text-xs">
                            • 삭제된 컬럼:{' '}
                            {changeDetails.columns.deleted.reduce((total, item) => total + item.columns.length, 0)}개
                          </div>
                        )}
                        {changeDetails.columns.updated.length > 0 && (
                          <div className="text-blue-600 text-xs">
                            • 수정된 컬럼:{' '}
                            {changeDetails.columns.updated.reduce((total, item) => total + item.columns.length, 0)}개
                          </div>
                        )}
                      </div>
                    )}

                    {/* 변화가 없는 경우 */}
                    {changeDetails.tables.added.length === 0 &&
                      changeDetails.tables.deleted.length === 0 &&
                      changeDetails.columns.added.length === 0 &&
                      changeDetails.columns.deleted.length === 0 &&
                      changeDetails.columns.updated.length === 0 && (
                        <div className="text-gray-500 text-xs">구체적인 변화 내용을 확인 중입니다...</div>
                      )}
                  </div>

                  {/* 업데이트 버튼 */}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        handleUpdateCatalog();
                      }}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          <span>업데이트 중...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          <span>카탈로그 업데이트</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 툴팁 화살표 */}
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                </div>
              </div>
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
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTableClick(table.tableName)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Table className="mr-3 text-blue-500" size={16} />
                      <span className="font-medium text-gray-900">{table.tableName}</span>
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
