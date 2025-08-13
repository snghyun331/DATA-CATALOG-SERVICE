import React from "react";
import { Settings } from "lucide-react";

interface StatsCardProps {
  value: string;
  label: string;
  change: string;
  changeType: "positive" | "negative" | "warning" | "info";
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ value, label, change, changeType, icon }) => {
  const getChangeColor = (type: string): string => {
    switch (type) {
      case "positive":
        return "text-green-600 bg-green-50";
      case "negative":
        return "text-red-600 bg-red-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "info":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 min-h-[140px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className={`text-sm px-3 py-1.5 rounded-full ${getChangeColor(changeType)}`}>{change}</span>
        </div>
        <Settings className="text-gray-400" size={18} />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-base text-gray-600 flex items-center">
        {icon}
        {label}
      </div>
    </div>
  );
};

export default StatsCard;
