import React, { useState, useEffect } from 'react';
import { Database, Clock } from 'lucide-react';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short'
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: Title and Subtitle */}
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Database className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Data Catalog Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-0.5 font-medium">
              Monitor and manage your database ecosystem
            </p>
          </div>
        </div>

        {/* Right: Real-time Clock */}
        <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-500">
              Korea Standard Time
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;