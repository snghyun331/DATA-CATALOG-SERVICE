import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Eye, Edit3, MoreHorizontal } from 'lucide-react';
import { useDatabaseCatalog, useDatabaseStats } from '../hooks/useDatabase.query';

interface TableData {
  tableName: string;
  columns: number;
  records: string;
  size: string;
  description: string;
  note: string;
}

const MasterSheet: React.FC = () => {
  const { dbName } = useParams<{ dbName: string }>();
  const navigate = useNavigate();

  // API 호출
  const { data: databaseStats, isLoading: statsLoading, error: statsError } = useDatabaseStats(dbName!);
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useDatabaseCatalog(dbName!);

  // 로딩 상태
  if (statsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading database information...</div>
      </div>
    );
  }

  const dbStats = databaseStats?.data;
  const rawTablesData = tablesData?.data || [];

  // API 응답을 TableData 형태로 변환
  const masterSheetData: TableData[] = rawTablesData.map((table: any) => ({
    tableName: table.TABLE_NAME,
    columns: table.TABLE_COLUMNS,
    records: table.TABLE_ROWS,
    size: `${table.DATA_SIZE}MB`,
    description: table.TABLE_DESCRIPTION,
    note: table.TABLE_COMMENT,
  }));

  const handleBack = (): void => {
    navigate('/overview');
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
              <button onClick={() => navigate('/overview')} className="text-gray-400 hover:text-gray-500">
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
                onClick={() => navigate('/overview')}
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
            ← Back to Overview
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">Total Tables</div>
            <div className="text-2xl font-bold text-blue-900">{dbStats.tableCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Total Records</div>
            <div className="text-2xl font-bold text-green-900">{dbStats.rows}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Total Size</div>
            <div className="text-2xl font-bold text-purple-900">{dbStats.dbSize}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">Last Update</div>
            <div className="text-2xl font-bold text-orange-900">{dbStats.lastUpdated}</div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tables ({masterSheetData.length})</h3>
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
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.note}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTableClick(table.tableName);
                        }}
                        title="View Table Catalog"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="Edit Table"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="More Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
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
