import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Search,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  MoreHorizontal,
  Database,
  HardDrive,
  Users,
} from "lucide-react";

// Types
interface TableInfo {
  id: string;
  name: string;
  database: string;
  columns: number;
  records: string;
  size: string;
  lastUpdate: string;
  type: "primary" | "secondary" | "lookup" | "log" | "config";
  status: "active" | "maintenance" | "error";
  engine: "MySQL" | "PostgreSQL" | "MongoDB";
  lastAccessed: string;
  owner: string;
}

// Mock data - 실제로는 API에서 가져올 데이터
const mockTables: TableInfo[] = [
  {
    id: "1",
    name: "users",
    database: "UserDB",
    columns: 12,
    records: "125,430",
    size: "45MB",
    lastUpdate: "2 mins ago",
    type: "primary",
    status: "active",
    engine: "MySQL",
    lastAccessed: "1 min ago",
    owner: "john.doe",
  },
  {
    id: "2",
    name: "user_profiles",
    database: "UserDB",
    columns: 18,
    records: "125,430",
    size: "78MB",
    lastUpdate: "5 mins ago",
    type: "secondary",
    status: "active",
    engine: "MySQL",
    lastAccessed: "3 mins ago",
    owner: "jane.smith",
  },
  {
    id: "3",
    name: "products",
    database: "ProductDB",
    columns: 15,
    records: "8,720",
    size: "12MB",
    lastUpdate: "15 mins ago",
    type: "primary",
    status: "active",
    engine: "PostgreSQL",
    lastAccessed: "10 mins ago",
    owner: "mike.johnson",
  },
  {
    id: "4",
    name: "product_categories",
    database: "ProductDB",
    columns: 5,
    records: "156",
    size: "1MB",
    lastUpdate: "2 days ago",
    type: "lookup",
    status: "active",
    engine: "PostgreSQL",
    lastAccessed: "4 hours ago",
    owner: "sarah.wilson",
  },
  {
    id: "5",
    name: "orders",
    database: "OrderDB",
    columns: 12,
    records: "89,340",
    size: "78MB",
    lastUpdate: "5 mins ago",
    type: "primary",
    status: "active",
    engine: "MySQL",
    lastAccessed: "2 mins ago",
    owner: "david.brown",
  },
  {
    id: "6",
    name: "order_items",
    database: "OrderDB",
    columns: 7,
    records: "234,580",
    size: "145MB",
    lastUpdate: "5 mins ago",
    type: "secondary",
    status: "active",
    engine: "MySQL",
    lastAccessed: "2 mins ago",
    owner: "david.brown",
  },
  {
    id: "7",
    name: "user_sessions",
    database: "UserDB",
    columns: 8,
    records: "892,100",
    size: "156MB",
    lastUpdate: "30 secs ago",
    type: "log",
    status: "active",
    engine: "MySQL",
    lastAccessed: "10 secs ago",
    owner: "system",
  },
  {
    id: "8",
    name: "audit_logs",
    database: "AnalyticsDB",
    columns: 11,
    records: "2,340,560",
    size: "890MB",
    lastUpdate: "1 min ago",
    type: "log",
    status: "error",
    engine: "MongoDB",
    lastAccessed: "5 mins ago",
    owner: "system",
  },
  {
    id: "9",
    name: "app_settings",
    database: "UserDB",
    columns: 4,
    records: "23",
    size: "256KB",
    lastUpdate: "1 week ago",
    type: "config",
    status: "maintenance",
    engine: "MySQL",
    lastAccessed: "2 days ago",
    owner: "admin",
  },
];

const Tables: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDatabase, setFilterDatabase] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof TableInfo>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const navigate = useNavigate();

  // 필터링 및 정렬된 테이블 목록
  const filteredTables = useMemo(() => {
    let filtered = mockTables;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (table) =>
          table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          table.database.toLowerCase().includes(searchTerm.toLowerCase()) ||
          table.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 데이터베이스 필터
    if (filterDatabase !== "all") {
      filtered = filtered.filter((table) => table.database === filterDatabase);
    }

    // 타입 필터
    if (filterType !== "all") {
      filtered = filtered.filter((table) => table.type === filterType);
    }

    // 상태 필터
    if (filterStatus !== "all") {
      filtered = filtered.filter((table) => table.status === filterStatus);
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [searchTerm, filterDatabase, filterType, filterStatus, sortField, sortDirection]);

  // 유니크한 데이터베이스 목록
  const databases = [...new Set(mockTables.map((table) => table.database))];

  const handleSort = (field: keyof TableInfo) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTables((prev) => (prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]));
  };

  const handleSelectAll = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map((table) => table.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "primary":
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case "secondary":
        return <div className="w-2 h-2 bg-purple-500 rounded-full"></div>;
      case "lookup":
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case "log":
        return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case "config":
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const getSortIcon = (field: keyof TableInfo) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    return (
      <svg
        className={`w-4 h-4 text-blue-600 ${sortDirection === "desc" ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // 통계 계산
  const totalTables = mockTables.length;
  const activeTables = mockTables.filter((t) => t.status === "active").length;
  const totalRecords = mockTables.reduce((sum, table) => {
    const records = parseInt(table.records.replace(/,/g, ""));
    return sum + records;
  }, 0);
  const avgColumns = Math.round(mockTables.reduce((sum, table) => sum + table.columns, 0) / totalTables);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all database tables across your infrastructure</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            Create Table
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Table className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTables}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tables</p>
              <p className="text-2xl font-semibold text-gray-900">{activeTables}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Columns</p>
              <p className="text-2xl font-semibold text-gray-900">{avgColumns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Database</label>
            <select
              value={filterDatabase}
              onChange={(e) => setFilterDatabase(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Databases</option>
              {databases.map((db) => (
                <option key={db} value={db}>
                  {db}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="lookup">Lookup</option>
              <option value="log">Log</option>
              <option value="config">Config</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Tables ({filteredTables.length})</h3>
            {selectedTables.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{selectedTables.length} selected</span>
                <button className="text-sm text-red-600 hover:text-red-800">Delete Selected</button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTables.length === filteredTables.length && filteredTables.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Table Name</span>
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("database")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Database</span>
                    {getSortIcon("database")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("columns")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Columns</span>
                    {getSortIcon("columns")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTables.map((table) => (
                <tr key={table.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table.id)}
                      onChange={() => handleSelectTable(table.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Table className="mr-3 h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{table.name}</div>
                        <div className="text-sm text-gray-500">{table.engine}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/database/${table.database}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {table.database}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(table.type)}
                      <span className="text-sm text-gray-900 capitalize">{table.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.columns}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.records}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        table.status
                      )}`}
                    >
                      {table.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.owner}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{table.lastUpdate}</div>
                    <div className="text-sm text-gray-500">Accessed: {table.lastAccessed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" title="View Table">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800" title="Edit Table">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Delete Table">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800" title="More Options">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <Table className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterDatabase !== "all" || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first table."}
            </p>
            {searchTerm === "" && filterDatabase === "all" && filterType === "all" && filterStatus === "all" && (
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Table
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tables;
