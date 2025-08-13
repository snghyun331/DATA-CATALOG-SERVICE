import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import DatabaseList from '../components/DatabaseList';
import { Database, Table, HardDrive, Zap, Plus } from 'lucide-react';
import type { Database as DatabaseType } from '../App';
import { useDashboardOverview } from '../hooks/useDashboard.query';
import AddDatabaseModal from '../components/AddDatabaseModal';
import { useAddDatabase } from '../hooks/useDatabase.query';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, error } = useDashboardOverview();
  const addDatabaseMutation = useAddDatabase();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingVisible, setIsLoadingVisible] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleDBSelect = (db: DatabaseType): void => {
    navigate(`/database/${db.name}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading dashboard: {error.message}</div>
      </div>
    );
  }

  // API 응답이 없는 경우 기본값 사용
  if (!dashboardData?.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No dashboard data available</div>
      </div>
    );
  }

  const { totalStats, dbStats } = dashboardData.data;

  const handleAddDatabase = async (formData: any) => {
    // 로딩 시작
    setIsLoadingVisible(true);
    // 최소 3초 로딩 보장
    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      // API 호출과 최소 로딩 시간을 동시에 기다림
      await Promise.all([addDatabaseMutation.mutateAsync(formData), minLoadingTime]);

      // 성공 처리
      setIsModalOpen(false);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Database Added Successfully',
        message: `Database "${formData.dbName}" has been successfully added to your system.`,
      });
    } catch (error: any) {
      // 실패 처리
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Failed to Add Database',
        message:
          error?.response?.data?.message ||
          'An unexpected error occurred while adding the database. Please check your connection settings and try again.',
      });
    } finally {
      setIsLoadingVisible(false);
    }
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Data Catalog Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600">Monitor and manage your database ecosystem</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard
          value={totalStats.dbCount?.toString() || '0'}
          label="Total Databases"
          change="↗ 8%"
          changeType="positive"
          icon={<Database className="mr-2 text-blue-500" size={16} />}
        />

        <StatsCard
          value={totalStats.totalTableCount?.toString() || '0'}
          label="Total Tables"
          change="↘ 3%"
          changeType="negative"
          icon={<Table className="mr-2 text-orange-500" size={16} />}
        />

        <StatsCard
          value={totalStats.totalRows?.toString() || '0'}
          label="Total Rows"
          change="Active"
          changeType="warning"
          icon={<HardDrive className="mr-2 text-purple-500" size={16} />}
        />

        <StatsCard
          value={totalStats.latestUpdated ? new Date(totalStats.latestUpdated).toLocaleString() : 'No Updates'}
          label="Last Update"
          change="Live"
          changeType="info"
          icon={<Zap className="mr-2 text-green-500" size={16} />}
        />
      </div>
      {/* Database List Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <HardDrive className="h-6 w-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">Database List</h2>
        </div>
        <div className="flex items-center space-x-3">
          {dbStats.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Database
            </button>
          )}
        </div>
      </div>
      {dbStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-8 bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 shadow-lg">
          <div className="text-center">
            <Database className="mx-auto h-24 w-24 text-gray-300" />
            <h3 className="mt-6 text-2xl font-semibold text-gray-900">No Databases Found</h3>
            <p className="mt-4 text-lg text-gray-500 max-w-md">
              Get started by adding your first database to the catalog.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6 mr-3" />
            Add Database
          </button>
        </div>
      ) : (
        <DatabaseList
          databases={dbStats.map((db) => ({
            name: db.dbName,
            tables: db.tableCount,
            size: `${db.dbSize}MB`,
            lastUpdate: new Date(db.lastUpdated).toLocaleString(),
            status: db.dbTag,
          }))}
          onDBSelect={handleDBSelect}
        />
      )}

      {/* Add Database Modal */}
      <AddDatabaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddDatabase}
        isLoading={isLoadingVisible}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoadingVisible} message="Connecting to database and validating settings..." />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
};

export default Overview;
