import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Network, Database, Loader, AlertCircle, Search, Filter } from 'lucide-react';
import ERDVisualization from '../components/ERDVisualization';
import { DashboardApi } from '../api/dashboard/dashboard.api';
import apiClient from '../api/apiClient';

const Erd: React.FC = () => {
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchParams] = useSearchParams();

  // 전체 데이터베이스 목록 조회 (Overview와 동일한 데이터)
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: DashboardApi.getOverview,
    refetchOnWindowFocus: true, // 탭 전환 시 최신 데이터 반영
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });

  // 선택된 데이터베이스의 ERD 데이터 조회
  const {
    data: erdData,
    isLoading: erdLoading,
    error: erdError,
  } = useQuery({
    queryKey: ['database-erd', selectedDatabase],
    queryFn: () => apiClient.get(`/databases/${selectedDatabase}/erd`),
    enabled: selectedDatabase !== 'all' && selectedDatabase !== '',
  });

  // 다양한 응답 구조에 대응
  let databases = [];
  if (dashboardData?.data?.data?.dbStats) {
    databases = dashboardData.data.data.dbStats;
  } else if (dashboardData?.data?.dbStats) {
    databases = dashboardData.data.dbStats;
  } else if (dashboardData?.data) {
    databases = dashboardData.data;
  }

  const filteredDatabases = databases.filter(
    (db: any) => searchTerm === '' || db.dbName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // URL 파라미터로부터 선택할 DB 확인 및 자동 선택
  useEffect(() => {
    const dbFromUrl = searchParams.get('db');
    if (dbFromUrl && databases.some((db: any) => db.dbName === dbFromUrl)) {
      setSelectedDatabase(dbFromUrl);
    }
  }, [searchParams, databases]);

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading databases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Network className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">데이터베이스 관계도(ERD)</h1>
                <p className="text-sm text-gray-500">데이터베이스 테이블 관계와 구조를 시각화합니다</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search databases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Database Selector */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDatabase}
                onChange={(e) => setSelectedDatabase(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Select Database</option>
                {filteredDatabases.map((db: any) => (
                  <option key={db.dbName} value={db.dbName}>
                    {db.dbName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {selectedDatabase === 'all' || selectedDatabase === '' ? (
          <div className="flex h-full">
            {/* Database List Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Databases</h3>

                {filteredDatabases.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No databases match your search' : 'No databases available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDatabases.map((db: any) => (
                      <div
                        key={db.dbName}
                        onClick={() => setSelectedDatabase(db.dbName)}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Database className="h-5 w-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{db.dbName}</h4>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Tables:</span>
                                <span className="font-medium">{db.tableCount}</span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Size:</span>
                                <span className="font-medium">{db.dbSize} MB</span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>Updated:</span>
                                <span className="font-medium">{new Date(db.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {db.dbTag && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {db.dbTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Database</h3>
                <p className="text-gray-500 max-w-md">
                  Choose a database from the sidebar to view its Entity Relationship Diagram and explore table
                  relationships.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // ERD View
          <div className="h-full flex flex-col">
            {/* ERD Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium text-gray-900">{selectedDatabase} ERD</h2>
                </div>

                {erdData?.data && (
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{erdData.data.tables.length}</div>
                      <div className="text-gray-500">Tables</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{erdData.data.relationships.length}</div>
                      <div className="text-gray-500">Relations</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">
                        {Object.keys(erdData.data.primaryKeys).length}
                      </div>
                      <div className="text-gray-500">PK Tables</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ERD Content */}
            <div className="flex-1 relative">
              {erdLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading ERD for {selectedDatabase}...</p>
                  </div>
                </div>
              ) : erdError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load ERD</h3>
                    <p className="text-red-600 mb-4">Error: {(erdError as Error).message}</p>
                  </div>
                </div>
              ) : erdData?.data ? (
                <ERDVisualization erdData={erdData.data} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No ERD Data Available</h3>
                    <p className="text-gray-600 mb-4">No table relationships found for {selectedDatabase}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            {erdData?.data && (
              <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-1 bg-red-600 rounded relative">
                        <div className="absolute -right-1 -top-1 w-0 h-0 border-l-2 border-r-0 border-t-2 border-b-2 border-l-red-600 border-t-transparent border-b-transparent"></div>
                      </div>
                      <span>Foreign Key Relationship</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span>Primary Key</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database size={12} />
                      <span>Table Node</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    Use mouse wheel to zoom • Drag to pan • Click and drag nodes to reposition
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Erd;
