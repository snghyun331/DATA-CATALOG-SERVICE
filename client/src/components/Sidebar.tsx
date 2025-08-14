import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Home, Network } from 'lucide-react';

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
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Network, label: 'ERD Diagram', path: '/erd' },
  ];

  const handleMenuClick = (path: string): void => {
    navigate(path);
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
        <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
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
      </div>
    </div>
  );
};

export default Sidebar;
