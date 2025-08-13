import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Database, BarChart3, Table } from "lucide-react";

interface SidebarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  hasDropdown?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    { icon: BarChart3, label: "Overview", path: "/overview" },
    { icon: Table, label: "Tables", path: "/tables" },
  ];


  const handleMenuClick = (path: string): void => {
    navigate(path);
  };

  const isActive = (path: string): boolean => {
    if (path === "/overview") {
      return location.pathname === "/" || location.pathname === "/overview";
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
            onClick={() => handleMenuClick(item.path)}
            title={item.label}
          >
            <item.icon size={20} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
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
