import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import MasterSheet from './pages/MasterSheet';
import Tables from './pages/Tables';
import TableCatalog from './pages/TableCatalog';

// Types
export interface Database {
  name: string;
  tables: number;
  size: string;
  lastUpdate: string;
  status: 'active' | 'maintenance';
}

// Mock data - 실제로는 Context나 상태 관리 라이브러리에서 관리
export const databases: Database[] = [
  { name: 'UserDB', tables: 15, size: '2.3GB', lastUpdate: '2 mins ago', status: 'active' },
  { name: 'ProductDB', tables: 8, size: '1.1GB', lastUpdate: '5 mins ago', status: 'active' },
  { name: 'OrderDB', tables: 12, size: '3.7GB', lastUpdate: '1 hour ago', status: 'active' },
  { name: 'AnalyticsDB', tables: 6, size: '850MB', lastUpdate: '3 hours ago', status: 'maintenance' },
];

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="database/:dbName" element={<MasterSheet />} />
            <Route path="database/:dbName/table/:tableName" element={<TableCatalog />} />
            <Route path="tables" element={<Tables />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
