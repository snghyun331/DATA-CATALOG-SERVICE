import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Database, BarChart3, Table, ChevronLeft, ChevronRight, Home, Network } from "lucide-react";

interface SidebarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  hasDropdown?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { icon: Home, label: "Home", path: "/overview" },
    { icon: Network, label: "ERD Diagram", path: "/tables" },
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
    <div className={`${isExpanded ? 'w-64' : 'w-16'} bg-gray-900 flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              {/* PNG 로고가 들어갈 자리 */}
              <Database size={16} className="text-white" />
            </div>
            {isExpanded && (
              <span className="text-white font-bold text-lg">Data Catalog</span>
            )}
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 hover:scale-105"
            title={isExpanded ? "메뉴 닫기" : "메뉴 열기"}
          >
            {isExpanded ? (
              <ChevronLeft size={20} className="stroke-2" />
            ) : (
              <ChevronRight size={20} className="stroke-2" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-3">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center rounded-lg transition-colors ${
                isActive(item.path) 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              } ${isExpanded ? 'px-3 py-2.5' : 'px-2.5 py-2.5 justify-center'}`}
              onClick={() => handleMenuClick(item.path)}
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon size={20} />
              {isExpanded && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Help/Support Button at Bottom */}
      <div className="p-3 border-t border-gray-700">
        <button
          className={`w-full flex items-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors ${
            isExpanded ? 'px-3 py-2.5' : 'px-2.5 py-2.5 justify-center'
          }`}
          title={!isExpanded ? "Help & Support" : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {isExpanded && (
            <span className="ml-3 text-sm font-medium">Help & Support</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
