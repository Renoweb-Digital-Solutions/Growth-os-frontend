"use client";

// Reason: Shared dashboard layout that wraps ALL /dashboard/* routes with the Sidebar.
// How: Next.js nested layout — this file sits at app/dashboard/layout.js and automatically
//      wraps every child page (page.js, work-status/page.js, analytics/page.js, etc.)
//      with the persistent Sidebar. Each child page only renders its own content.
// Central State: None — Sidebar manages its own nav state via usePathname().

import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Sidebar — fixed left, full height. Shared across all dashboard pages. */}
      <Sidebar />

      {/* Main scrollable content area — each page renders into {children} */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
