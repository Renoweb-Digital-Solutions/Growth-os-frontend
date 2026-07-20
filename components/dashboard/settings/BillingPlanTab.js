"use client";

import { CheckCircle2, Zap } from "lucide-react";

export default function BillingPlanTab() {
  return (
    <div className="dashboard-card p-6 md:p-8 max-w-3xl">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Billing & Plan</h3>
      
      {/* Current Plan Card */}
      <div className="p-5 border border-indigo-100 bg-indigo-50/30 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-indigo-100 opacity-50">
          <Zap className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Current Plan
            </span>
            <span className="text-sm font-semibold text-slate-500">Renews on Aug 20, 2026</span>
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mb-1">Growth Pro</h4>
          <p className="text-slate-600 text-sm">Advanced analytics, reporting, and team collaboration.</p>
        </div>
        
        <div className="relative z-10 flex flex-col items-start md:items-end gap-3">
          <div className="text-3xl font-bold text-slate-900">$299<span className="text-sm text-slate-500 font-medium">/mo</span></div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              Cancel Plan
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold rounded-lg shadow-sm shadow-indigo-500/20 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div>
        <h4 className="text-[15px] font-semibold text-slate-800 mb-4">Plan Usage</h4>
        <div className="space-y-5">
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[13px] font-medium text-slate-700">Team seats</span>
              <span className="text-[12px] text-slate-500 font-semibold">4 / 10 used</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[13px] font-medium text-slate-700">Connected accounts</span>
              <span className="text-[12px] text-slate-500 font-semibold">6 / 15 used</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
