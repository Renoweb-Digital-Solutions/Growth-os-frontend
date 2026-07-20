"use client";

import { User, CreditCard, Wallet, Users, Bell, Blocks, ShieldCheck } from "lucide-react";

export const settingsTabsConfig = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "payments", label: "Payment Methods", icon: Wallet },
  { id: "team", label: "Team Members", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Blocks },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function SettingsTabs({ activeTab, setActiveTab }) {
  return (
    <div className="w-full md:w-[240px] flex-shrink-0">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
        {settingsTabsConfig.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap ${
                isActive 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
