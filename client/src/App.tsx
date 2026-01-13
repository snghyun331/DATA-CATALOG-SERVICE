import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MasterSheet from './pages/MasterSheet';
import Erd from './pages/Erd';
import TableCatalog from './pages/TableCatalog';

export interface Database {
  name: string;
  tables: number;
  size: string;
  lastUpdate: string;
  status: 'active' | 'maintenance';
}

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="database/:dbName" element={<MasterSheet />} />
            <Route path="database/:dbName/table/:tableName" element={<TableCatalog />} />
            <Route path="erd" element={<Erd />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
