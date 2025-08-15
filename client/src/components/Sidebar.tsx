import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Home, Network, BarChart3 } from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  hasDropdown?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Network, label: 'ERD Diagram', path: '/erd' },
    { icon: BarChart3, label: 'Chart', path: '/chart' },
  ];

  const handleMenuClick = (path: string): void => {
    if (path === '/chart') {
      setShowComingSoon(true);
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string): boolean => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img src="/acg.png" alt="ACG Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-white font-bold text-lg">ACG</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-3">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => handleMenuClick(item.path)}
            >
              <item.icon size={20} />
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Help/Support Button at Bottom */}
      <div className="p-3 border-t border-gray-700">
        <div className="relative">
          <button 
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="ml-3 text-sm font-medium">Help & Support</span>
          </button>
          
          {/* Custom Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium whitespace-nowrap">
                TECH 팀에게 문의해주세요
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 mx-4 max-w-md w-full text-center">
            <div className="mb-6">
              <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chart 기능</h3>
              <p className="text-gray-600">
                차트 및 분석 기능은 현재 개발 중입니다.<br />
                추후 업데이트 예정입니다.
              </p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
