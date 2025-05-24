import React from "react";
import { Database, TrendingUp } from "lucide-react";

interface DatabaseType {
  name: string;
  tables: number;
  size: string;
  lastUpdate: string;
  status: "active" | "maintenance";
}

interface DatabaseListProps {
  databases: DatabaseType[];
  onDBSelect: (db: DatabaseType) => void;
}

const DatabaseList: React.FC<DatabaseListProps> = ({ databases, onDBSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="mr-2" size={20} />
          Database Status
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {databases.map((db, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onDBSelect(db)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{db.name}</div>
                  <div className="text-sm text-gray-500">Last update: {db.lastUpdate}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{db.tables} tables</div>
                  <div className="text-sm text-gray-500">{db.size}</div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    db.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {db.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseList;
