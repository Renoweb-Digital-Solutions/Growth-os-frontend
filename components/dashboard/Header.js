"use client";

import { useState, useEffect } from "react";
import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react";

// Reason: Top header provides search, notifications, user info, and filter controls.
// How: Renders a search bar with ⌘K hint, icon buttons, welcome greeting, and
//      three filter dropdowns. All filter state is local for now.
// Receives: nothing (self-contained, reads userProfile from mockData)
// Passes: nothing

export default function Header() {
  const [userProfile, setUserProfile] = useState({ name: "User", avatar: "U" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.user && payload.user.name) {
          setUserProfile({
            name: payload.user.name.split(" ")[0], // Display first name
            avatar: payload.user.name.charAt(0).toUpperCase()
          });
        }
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

  return (
    <header className="mb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Search */}
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-[13.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-md border border-slate-200">
            ⌘K
          </kbd>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors relative">
            <Bell className="w-[18px] h-[18px] text-slate-500" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            <HelpCircle className="w-[18px] h-[18px] text-slate-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold ml-1 cursor-pointer">
            {userProfile.avatar}
          </div>
        </div>
      </div>

      {/* Welcome + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userProfile.name}! 👋
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your growth today.
          </p>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill label="Time" value="Last 30 days" />
          <FilterPill label="Channel" value="All channels" />
          <FilterPill label="Region" value="Global" />
        </div>
      </div>
    </header>
  );
}

// Reason: Reusable dropdown pill component to avoid duplicating filter markup.
// How: Renders a styled button with label, value text, and chevron icon.
function FilterPill({ label, value }) {
  return (
    <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] hover:border-slate-300 transition-colors">
      <span className="text-slate-400 font-medium">{label}:</span>
      <span className="text-slate-700 font-semibold">{value}</span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </button>
  );
}
