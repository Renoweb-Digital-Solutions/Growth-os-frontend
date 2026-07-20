"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  FileText,
  Ticket,
  CalendarClock,
  Settings,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";

// Reason: The sidebar is the primary navigation shell for the entire dashboard.
// How: Renders a fixed-width sidebar on desktop (240px) with grouped nav items,
//      and collapses to a hamburger overlay on mobile via state toggle.

// Receives: nothing (self-contained, reads current route from usePathname)
// Passes: nothing (uses Link for navigation)

const navSections = [
  {
    label: null,
    items: [
      { name: "Home", icon: LayoutDashboard, href: "/dashboard" },
      { name: "Work Status", icon: ListChecks, href: "/dashboard/work-status" },
      { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
      { name: "Reports", icon: FileText, href: "/dashboard/reports" },
      { name: "Tickets", icon: Ticket, href: "/dashboard/tickets" },
    ],
  },
  {
    label: null,
    items: [
      { name: "Book a Call", icon: CalendarClock, href: "/dashboard/book-call" },
      { name: "Settings", icon: Settings, href: "/dashboard/settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: "User", email: "", avatar: "U" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.user) {
          setUserProfile({
            name: payload.user.name || "User",
            email: payload.user.email || "",
            avatar: (payload.user.name || "U").charAt(0).toUpperCase()
          });
        }
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

  // Reason: Allows users to securely end their session.
  // How: Removes JWT from localStorage and redirects to /auth.
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  const isActive = (href) => pathname === href;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <span className="text-[17px] font-bold text-slate-900 tracking-tight">
          Growth OS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.label && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        active ? "text-indigo-600" : "text-slate-400"
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            {sIdx < navSections.length - 1 && (
              <div className="mt-5 mx-3 border-t border-slate-100" />
            )}
          </div>
        ))}
      </nav>

      {/* User profile block */}
      <div className="px-3 pb-5 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 mb-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-[13px] font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {userProfile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">
              {userProfile.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {userProfile.email}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-200"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-white z-50 shadow-2xl transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-4 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] min-w-[240px] bg-white border-r border-slate-200/80 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
