"use client";

import { LayoutDashboard, Megaphone } from "lucide-react";
import FacebookIcon from "@/components/icons/FacebookIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "facebook", label: "Facebook", icon: FacebookIcon },
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "ads", label: "Ads", icon: Megaphone },
];

export default function AnalyticsTabsNav({ activeTab, onTabChange, capabilities }) {
  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto scrollbar-none">
      <nav className="flex space-x-6 min-w-max" aria-label="Analytics Navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Capability status indicator
          let isUnavailable = false;
          if (tab.id === "instagram" && capabilities?.instagram?.available === false) {
            isUnavailable = true;
          } else if (tab.id === "facebook" && capabilities?.social?.available === false) {
            isUnavailable = true;
          } else if (tab.id === "ads" && capabilities?.ads?.available === false) {
            isUnavailable = true;
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 text-[13.5px] font-medium border-b-2 transition-all relative ${
                isActive
                  ? "border-indigo-600 text-indigo-600 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>

              {isUnavailable && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Capability not connected" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
