import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Key, Link, Search, FileText, BarChart3 } from 'lucide-react';

// Types
interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: { table: string; column: string };
  description?: string;
}

interface TableCatalogData {
  description: string;
  engine: string;
  totalRows: string;
  dataSize: string;
  columns: ColumnInfo[];
}

type TabType = 'schema' | 'stats';

const TableCatalog: React.FC = () => {
  const { dbName, tableName } = useParams<{ dbName: string; tableName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('schema');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - ProductDB의 orders 테이블
  const getTableCatalog = (dbName: string, tableName: string): TableCatalogData | null => {
    if (dbName === 'ProductDB' && tableName === 'orders') {
      return {
        description: 'Customer order records with payment and shipping information',
        engine: 'PostgreSQL',
        totalRows: '89,340',
        dataSize: '78.2 MB',
        columns: [
          {
            name: 'order_id',
            type: 'BIGINT',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: true,
            isForeignKey: false,
            description: 'Unique identifier for each order',
          },
          {
            name: 'customer_id',
            type: 'BIGINT',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: false,
            isForeignKey: true,
            foreignKeyRef: { table: 'customers', column: 'customer_id' },
            description: 'Reference to customer who placed the order',
          },
          {
            name: 'product_id',
            type: 'BIGINT',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: false,
            isForeignKey: true,
            foreignKeyRef: { table: 'products', column: 'product_id' },
            description: 'Reference to the ordered product',
          },
          {
            name: 'quantity',
            type: 'INT',
            nullable: false,
            defaultValue: '1',
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'Number of items ordered',
          },
          {
            name: 'unit_price',
            type: 'DECIMAL(10,2)',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'Price per unit at time of order',
          },
          {
            name: 'total_amount',
            type: 'DECIMAL(10,2)',
            nullable: false,
            defaultValue: null,
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'Total order amount',
          },
          {
            name: 'order_status',
            type: 'ENUM',
            nullable: false,
            defaultValue: "'pending'",
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'Current status of the order',
          },
          {
            name: 'payment_method',
            type: 'VARCHAR(50)',
            nullable: true,
            defaultValue: null,
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'Payment method used',
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            nullable: false,
            defaultValue: 'CURRENT_TIMESTAMP',
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'When the order was created',
          },
          {
            name: 'updated_at',
            type: 'TIMESTAMP',
            nullable: false,
            defaultValue: 'CURRENT_TIMESTAMP',
            isPrimaryKey: false,
            isForeignKey: false,
            description: 'When the order was last updated',
          },
        ],
      };
    }
    return null;
  };

  const tableCatalog = getTableCatalog(dbName!, tableName!);

  if (!tableCatalog) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Table className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Table not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The table "{tableName}" in database "{dbName}" could not be found.
        </p>
        <button
          onClick={() => navigate(`/database/${dbName}`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Back to {dbName}
        </button>
      </div>
    );
  }

  // Filter columns
  const filteredColumns = tableCatalog.columns.filter(
    (column) =>
      column.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      column.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTypeColor = (type: string): string => {
    if (type.includes('INT')) return 'bg-blue-100 text-blue-800';
    if (type.includes('VARCHAR') || type.includes('TEXT')) return 'bg-green-100 text-green-800';
    if (type.includes('DECIMAL')) return 'bg-purple-100 text-purple-800';
    if (type.includes('TIMESTAMP')) return 'bg-orange-100 text-orange-800';
    if (type.includes('ENUM')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <button onClick={() => navigate('/overview')} className="hover:text-gray-700">
          Home
        </button>
        <span>/</span>
        <button onClick={() => navigate(`/database/${dbName}`)} className="hover:text-gray-700">
          {dbName}
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tableName}</span>
      </nav>

      {/* Table Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Table className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tableName}</h1>
            <p className="text-sm text-gray-500">{tableCatalog.description}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Engine</div>
            <div className="text-lg font-semibold text-gray-900">{tableCatalog.engine}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Rows</div>
            <div className="text-lg font-semibold text-gray-900">{tableCatalog.totalRows}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Data Size</div>
            <div className="text-lg font-semibold text-gray-900">{tableCatalog.dataSize}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('schema')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'schema'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Schema</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistics</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Schema Tab */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Columns ({tableCatalog.columns.length})</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredColumns.map((column, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{column.name}</span>
                        {column.isPrimaryKey && <Key className="w-4 h-4 text-yellow-500" title="Primary Key" />}
                        {column.isForeignKey && <Link className="w-4 h-4 text-blue-500" title="Foreign Key" />}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(column.type)}`}>
                          {column.type}
                        </span>
                        {!column.nullable && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            NOT NULL
                          </span>
                        )}
                      </div>
                      {column.defaultValue && (
                        <span className="text-sm text-gray-500">Default: {column.defaultValue}</span>
                      )}
                    </div>

                    {column.description && <p className="text-sm text-gray-600 mb-2">{column.description}</p>}

                    {column.isForeignKey && column.foreignKeyRef && (
                      <div className="text-sm text-blue-600">
                        → References {column.foreignKeyRef.table}.{column.foreignKeyRef.column}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Table Statistics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-sm font-medium text-blue-600 mb-2">Basic Information</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Rows:</span>
                      <span className="text-sm font-medium text-gray-900">{tableCatalog.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Data Size:</span>
                      <span className="text-sm font-medium text-gray-900">{tableCatalog.dataSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Engine:</span>
                      <span className="text-sm font-medium text-gray-900">{tableCatalog.engine}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="text-sm font-medium text-green-600 mb-2">Column Summary</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Columns:</span>
                      <span className="text-sm font-medium text-gray-900">{tableCatalog.columns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Primary Keys:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {tableCatalog.columns.filter((col) => col.isPrimaryKey).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Foreign Keys:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {tableCatalog.columns.filter((col) => col.isForeignKey).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableCatalog;
