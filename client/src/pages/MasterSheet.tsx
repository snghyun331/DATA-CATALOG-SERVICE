import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Eye, Edit3, MoreHorizontal } from "lucide-react";
import { databases } from "../App";

interface TableData {
  tableName: string;
  columns: number;
  records: string;
  lastUpdate: string;
  size: string;
  type: "primary" | "secondary" | "lookup" | "log" | "config";
  status: "active" | "maintenance" | "error";
}

const MasterSheet: React.FC = () => {
  const { dbName } = useParams<{ dbName: string }>();
  const navigate = useNavigate();

  // URL 파라미터로 데이터베이스 찾기
  const selectedDB = databases.find((db) => db.name === dbName);

  // Mock data - 실제로는 API에서 가져올 데이터
  const getMasterSheetData = (dbName: string): TableData[] => {
    const dataByDB: Record<string, TableData[]> = {
      UserDB: [
        {
          tableName: "users",
          columns: 12,
          records: "125,430",
          lastUpdate: "2 mins ago",
          size: "45MB",
          type: "primary",
          status: "active",
        },
        {
          tableName: "user_profiles",
          columns: 18,
          records: "125,430",
          lastUpdate: "5 mins ago",
          size: "78MB",
          type: "secondary",
          status: "active",
        },
        {
          tableName: "user_sessions",
          columns: 8,
          records: "892,100",
          lastUpdate: "30 secs ago",
          size: "156MB",
          type: "log",
          status: "active",
        },
        {
          tableName: "user_roles",
          columns: 4,
          records: "23",
          lastUpdate: "1 week ago",
          size: "256KB",
          type: "lookup",
          status: "active",
        },
        {
          tableName: "user_permissions",
          columns: 6,
          records: "340,280",
          lastUpdate: "1 day ago",
          size: "18MB",
          type: "secondary",
          status: "active",
        },
      ],
      ProductDB: [
        {
          tableName: "products",
          columns: 15,
          records: "8,720",
          lastUpdate: "15 mins ago",
          size: "12MB",
          type: "primary",
          status: "active",
        },
        {
          tableName: "categories",
          columns: 5,
          records: "156",
          lastUpdate: "2 days ago",
          size: "1MB",
          type: "lookup",
          status: "active",
        },
        {
          tableName: "inventory",
          columns: 8,
          records: "8,720",
          lastUpdate: "1 hour ago",
          size: "3.2MB",
          type: "secondary",
          status: "active",
        },
        {
          tableName: "product_reviews",
          columns: 9,
          records: "45,670",
          lastUpdate: "30 mins ago",
          size: "23MB",
          type: "secondary",
          status: "active",
        },
        {
          tableName: "orders",
          columns: 12,
          records: "89,340",
          lastUpdate: "5 mins ago",
          size: "78MB",
          type: "primary",
          status: "active",
        },
      ],
      OrderDB: [
        {
          tableName: "orders",
          columns: 12,
          records: "89,340",
          lastUpdate: "5 mins ago",
          size: "78MB",
          type: "primary",
          status: "active",
        },
        {
          tableName: "order_items",
          columns: 7,
          records: "234,580",
          lastUpdate: "5 mins ago",
          size: "145MB",
          type: "secondary",
          status: "active",
        },
        {
          tableName: "payments",
          columns: 10,
          records: "89,340",
          lastUpdate: "10 mins ago",
          size: "67MB",
          type: "primary",
          status: "active",
        },
        {
          tableName: "shipping",
          columns: 8,
          records: "89,340",
          lastUpdate: "15 mins ago",
          size: "45MB",
          type: "secondary",
          status: "active",
        },
      ],
      AnalyticsDB: [
        {
          tableName: "user_analytics",
          columns: 20,
          records: "2,340,560",
          lastUpdate: "1 min ago",
          size: "890MB",
          type: "log",
          status: "active",
        },
        {
          tableName: "page_views",
          columns: 12,
          records: "12,450,670",
          lastUpdate: "30 secs ago",
          size: "2.1GB",
          type: "log",
          status: "active",
        },
        {
          tableName: "conversion_events",
          columns: 15,
          records: "456,780",
          lastUpdate: "2 mins ago",
          size: "234MB",
          type: "log",
          status: "maintenance",
        },
        {
          tableName: "reports_cache",
          columns: 25,
          records: "12,340",
          lastUpdate: "1 hour ago",
          size: "45MB",
          type: "config",
          status: "active",
        },
      ],
    };
    return dataByDB[dbName] || [];
  };

  // 데이터베이스를 찾을 수 없는 경우
  if (!selectedDB) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Database not found</h3>
          <p className="mt-1 text-sm text-gray-500">The database "{dbName}" could not be found.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/overview")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const masterSheetData = getMasterSheetData(dbName!);

  const handleBack = (): void => {
    navigate("/overview");
  };

  const handleTableClick = (tableName: string): void => {
    navigate(`/database/${dbName}/table/${tableName}`);
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <div>
              <button onClick={() => navigate("/overview")} className="text-gray-400 hover:text-gray-500">
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
                onClick={() => navigate("/overview")}
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
              <span className="ml-4 text-sm font-medium text-gray-900">{selectedDB.name}</span>
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
              <h2 className="text-2xl font-bold text-gray-900">{selectedDB.name}</h2>
              <p className="text-sm text-gray-500">Database Overview</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedDB.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {selectedDB.status}
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
            <div className="text-2xl font-bold text-blue-900">{masterSheetData.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Total Records</div>
            <div className="text-2xl font-bold text-green-900">
              {masterSheetData
                .reduce((sum, table) => sum + parseInt(table.records.replace(/,/g, "")), 0)
                .toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Total Size</div>
            <div className="text-2xl font-bold text-purple-900">{selectedDB.size}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">Last Update</div>
            <div className="text-2xl font-bold text-orange-900">{selectedDB.lastUpdate}</div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Columns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(table.type)}
                      <span className="text-sm text-gray-900 capitalize">{table.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.columns}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.records}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.lastUpdate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(table.status)}`}>
                      {table.status}
                    </span>
                  </td>
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
                          console.log("Edit table:", table.tableName);
                        }}
                        title="Edit Table"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("More options for:", table.tableName);
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
