// Layout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 820) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on outside click (mobile only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only on mobile (screen width <= 820px)
      if (window.innerWidth <= 820 && isSidebarOpen) {
        // Check if click is outside sidebar and not on hamburger button
        const sidebar = document.querySelector(".sidebar");
        const hamburger = document.querySelector(".hamburger");

        if (
          sidebar &&
          !sidebar.contains(event.target) &&
          hamburger &&
          !hamburger.contains(event.target)
        ) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-wrapper">
        <Sidebar isOpen={isSidebarOpen} ref={sidebarRef} />
        <main
          className="main-content"
          onClick={() => {
            // Close sidebar on main content click (mobile only)
            if (window.innerWidth <= 820 && isSidebarOpen) {
              setIsSidebarOpen(false);
            }
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
