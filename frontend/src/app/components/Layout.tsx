import React from "react";
import { Outlet } from "react-router";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "#F8F9FA" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
