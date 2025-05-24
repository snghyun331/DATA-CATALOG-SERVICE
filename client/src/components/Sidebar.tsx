import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Database, BarChart3, Table } from "lucide-react";
import { databases } from "../App";
import type { Database as DatabaseType } from "../App";

interface SidebarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  hasDropdown?: boolean;
}

const Sidebar: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    { icon: BarChart3, label: "Overview", path: "/overview" },
    { icon: Database, label: "Databases", path: "/databases", hasDropdown: true },
    { icon: Table, label: "Tables", path: "/tables" },
  ];

  const handleDBClick = (db: DatabaseType): void => {
    navigate(`/database/${db.name}`);
    setActiveDropdown(null);
  };

  const handleMenuClick = (path: string, hasDropdown?: boolean): void => {
    if (!hasDropdown) {
      navigate(path);
    }
  };

  const isActive = (path: string): boolean => {
    if (path === "/overview") {
      return location.pathname === "/" || location.pathname === "/overview";
    }
    if (path === "/databases") {
      return location.pathname.startsWith("/database/");
    }
    return location.pathname === path;
  };

  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4">
      {/* Logo */}
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-8">
        <span className="text-white font-bold text-sm">DB</span>
      </div>

      {/* Menu Items */}
      {sidebarItems.map((item, index) => (
        <div key={index} className="relative group mb-2">
          <button
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive(item.path) ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            onMouseEnter={() => item.hasDropdown && setActiveDropdown("databases")}
            onMouseLeave={() => !item.hasDropdown && setActiveDropdown(null)}
            onClick={() => handleMenuClick(item.path, item.hasDropdown)}
            title={item.label}
          >
            <item.icon size={20} />
          </button>

          {/* Database Dropdown */}
          {item.hasDropdown && activeDropdown === "databases" && (
            <div
              className="absolute left-12 top-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50"
              onMouseEnter={() => setActiveDropdown("databases")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Databases</span>
              </div>
              {databases.map((db, dbIndex) => (
                <button
                  key={dbIndex}
                  onClick={() => handleDBClick(db)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors ${
                    location.pathname === `/database/${db.name}` ? "bg-blue-50 border-r-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${db.status === "active" ? "bg-green-400" : "bg-yellow-400"}`}
                    />
                    <div>
                      <div className="font-medium text-gray-900">{db.name}</div>
                      <div className="text-xs text-gray-500">
                        {db.tables} tables • {db.size}
                      </div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Tooltip for non-dropdown items */}
          {!item.hasDropdown && (
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </div>
      ))}

      {/* Help/Support Button at Bottom */}
      <div className="mt-auto">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group"
          title="Help & Support"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Help & Support
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
