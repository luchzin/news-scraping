"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AdminShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 md:ml-60">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-md border border-gray-300 p-2 md:hidden"
            >
              ☰
            </button>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          {action}
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}