import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Database, ArrowLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERDVisualization from '../components/ERDVisualization';
import apiClient from '../api/apiClient';

const DatabaseERD: React.FC = () => {
  const { dbName } = useParams<{ dbName: string }>();
  const navigate = useNavigate();

  // ERD 데이터 조회
  const { data: erdData, isLoading, error } = useQuery({
    queryKey: ['database-erd', dbName],
    queryFn: () => apiClient.get(`/api/v1/databases/${dbName}/erd`),
    enabled: !!dbName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ERD for {dbName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load ERD</h3>
          <p className="text-red-600 mb-4">Error: {(error as Error).message}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!erdData?.data?.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ERD Data Available</h3>
          <p className="text-gray-600 mb-4">No table relationships found for {dbName}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const erd = erdData.data.data;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-6 shadow-sm">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">ERD Visualization</span>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {erd.dbName}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Entity Relationship Diagram
              </p>
            </div>
          </div>
          
          {/* Enhanced Stats */}
          <div className="flex items-center space-x-8">
            <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{erd.tables.length}</div>
              <div className="text-sm text-blue-500 font-medium">Tables</div>
            </div>
            <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{erd.relationships.length}</div>
              <div className="text-sm text-green-500 font-medium">Relations</div>
            </div>
          </div>
        </div>
      </div>

      {/* ERD Visualization */}
      <div className="flex-1 relative">
        {erd.tables.length > 0 ? (
          <ERDVisualization erdData={erd} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
              <p className="text-gray-600">This database doesn't have any tables to display</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="font-medium">FK Relationships</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">Primary Keys</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="font-medium">Selected Connection</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database size={14} className="text-gray-600" />
              <span className="font-medium">Table Node</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
            💡 Scroll to zoom • Drag to pan • Click nodes to highlight connections
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseERD;