import React from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DatabaseList from "../components/DatabaseList";
import { Database, Table, HardDrive, Zap } from "lucide-react";
import { databases } from "../App";
import type { Database as DatabaseType } from "../App";

const Overview: React.FC = () => {
  const navigate = useNavigate();

  const handleDBSelect = (db: DatabaseType): void => {
    navigate(`/database/${db.name}`);
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          value="4"
          label="Total Databases"
          change="↗ 8%"
          changeType="positive"
          icon={<Database className="mr-2 text-blue-500" size={16} />}
        />

        <StatsCard
          value="41"
          label="Total Tables"
          change="↘ 3%"
          changeType="negative"
          icon={<Table className="mr-2 text-orange-500" size={16} />}
        />

        <StatsCard
          value="847"
          label="Total Columns"
          change="Active"
          changeType="warning"
          icon={<HardDrive className="mr-2 text-purple-500" size={16} />}
        />

        <StatsCard
          value="2 mins ago"
          label="Last Update"
          change="Live"
          changeType="info"
          icon={<Zap className="mr-2 text-green-500" size={16} />}
        />
      </div>

      {/* Database List */}
      <DatabaseList databases={databases} onDBSelect={handleDBSelect} />
    </>
  );
};

export default Overview;
