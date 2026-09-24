import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [mobileSidebarOpen,setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#F6F7F9] text-slate-900 transition-colors dark:bg-[#06101D] dark:text-white">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <div
        className={`min-h-dvh transition-[margin] duration-300 ${
          sidebarOpen
            ? "lg:ml-64"
            : "lg:ml-20"
        }`}
      >
        <Navbar
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;