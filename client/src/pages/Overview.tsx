import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import DatabaseList from '../components/DatabaseList';
import { Database, Table, HardDrive, Zap } from 'lucide-react';
import type { Database as DatabaseType } from '../App';
import { useDashboardOverview } from '../hooks/useDashboard.query';

const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, error } = useDashboardOverview();

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

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
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
          value={totalStats.latestUpdated ? new Date(totalStats.latestUpdated).toLocaleString() : 'Unknown'}
          label="Last Update"
          change="Live"
          changeType="info"
          icon={<Zap className="mr-2 text-green-500" size={16} />}
        />
      </div>
      Database List
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
    </>
  );
};

export default Overview;
