import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, Table, Key, FileText, Info, ArrowLeft } from 'lucide-react';
import { useTableCatalog, useTableStats, useUpdateColumnNote } from '../hooks/useTable.query';
import EditableDescription from './EditDescription';

const TableCatalog: React.FC = () => {
  const { dbName, tableName } = useParams<{ dbName: string; tableName: string }>();
  const navigate = useNavigate();

  // API 호출
  const { data: tableStats, isLoading: statsLoading, error: statsError } = useTableStats(dbName!, tableName!);
  const { data: columnsData, isLoading: columnsLoading, error: columnsError } = useTableCatalog(dbName!, tableName!);
  const updateColumnNoteMutation = useUpdateColumnNote();

  // 로딩 상태
  if (statsLoading || columnsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading table information...</div>
      </div>
    );
  }

  // 에러 상태
  if (statsError || columnsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading table</h3>
          <p className="mt-1 text-sm text-red-500">
            {statsError?.message || columnsError?.message || 'Failed to load table information'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(`/database/${dbName}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Database
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!tableStats?.data || !columnsData?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Table not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The table "{tableName}" could not be found in database "{dbName}".
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(`/database/${dbName}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Database
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateColumnNote = (columnName: string, newNote: string) => {
    updateColumnNoteMutation.mutate({
      dbName: dbName!,
      tableName: tableName!,
      columnName,
      note: newNote,
    });
  };

  const stats = tableStats.data;
  const columns = columnsData.data;

  // 컬럼 통계 계산
  const columnStats = {
    totalColumns: stats.totalColumns,
    totalRecords: stats.totalRecords,
    tableSize: `${stats.tableSize}MB`,
    primaryKeys: columns.filter((col: any) => col.COLUMN_KEY === 'PRI').length,
    nullableColumns: columns.filter((col: any) => col.IS_NULLABLE === 'YES').length,
    requiredColumns: columns.filter((col: any) => col.IS_NULLABLE === 'NO').length,
  };

  const getKeyIcon = (columnKey: string) => {
    switch (columnKey) {
      case 'PRI':
        return <Key className="w-4 h-4 text-yellow-500" title="Primary Key" />;
      case 'UNI':
        return <Key className="w-4 h-4 text-blue-500" title="Unique Key" />;
      case 'MUL':
        return <Key className="w-4 h-4 text-green-500" title="Index" />;
      default:
        return null;
    }
  };

  const getNullableColor = (isNullable: string) => {
    return isNullable === 'YES' ? 'text-gray-500' : 'text-blue-600 font-medium';
  };

  const handleBack = () => {
    navigate(`/database/${dbName}`);
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
              <button
                onClick={() => navigate(`/database/${dbName}`)}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {dbName}
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
              <span className="ml-4 text-sm font-medium text-gray-900">{tableName}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Table Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Table className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tableName}</h1>
              <p className="text-sm text-gray-500">Table Schema</p>
            </div>
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {dbName}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm text-blue-600 mb-1">Total Columns</div>
                <div className="text-2xl font-bold text-blue-900">{columnStats.totalColumns}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm text-green-600 mb-1">Total Records</div>
                <div className="text-2xl font-bold text-green-900">{columnStats.totalRecords.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-sm text-purple-600 mb-1">Table Size</div>
                <div className="text-2xl font-bold text-purple-900">{columnStats.tableSize}</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <div className="text-sm text-yellow-600 mb-1">Primary Keys</div>
                <div className="text-2xl font-bold text-yellow-900">{columnStats.primaryKeys}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Columns ({columnStats.totalColumns})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nullable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {columns.map((column: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="mr-3 text-blue-500" size={16} />
                      <span className="font-medium text-gray-900">{column.COLUMN_NAME}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {column.COLUMN_TYPE}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getKeyIcon(column.COLUMN_KEY)}
                      {column.COLUMN_KEY && <span className="ml-2 text-sm text-gray-600">{column.COLUMN_KEY}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${getNullableColor(column.IS_NULLABLE)}`}>{column.IS_NULLABLE}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.COLUMN_DEFAULT || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{column.COLUMN_COMMENT || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                    <EditableDescription
                      value={column.COLUMN_NOTE || ''}
                      onSave={(newNote) => handleUpdateColumnNote(column.COLUMN_NAME, newNote)}
                      isLoading={updateColumnNoteMutation.isPending}
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

export default TableCatalog;
