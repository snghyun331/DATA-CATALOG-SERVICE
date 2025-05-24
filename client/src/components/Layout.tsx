import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { databases } from "../App";

const Layout: React.FC = () => {
  const location = useLocation();

  // 현재 경로에서 선택된 DB 정보 추출
  const getSelectedDB = () => {
    const dbName = location.pathname.split("/")[2]; // /database/UserDB -> UserDB
    if (location.pathname.startsWith("/database/") && dbName) {
      return databases.find((db) => db.name === dbName) || null;
    }
    return null;
  };

  const selectedDB = getSelectedDB();

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header selectedDB={selectedDB} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;
