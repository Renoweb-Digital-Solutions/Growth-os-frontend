"use client";

import { integrations } from "@/app/dashboard/settings/mockSettings";

export default function IntegrationsTab() {
  return (
    <div className="dashboard-card p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Integrations</h3>
        <p className="text-[13px] text-slate-500 mt-1">Connect your tools to pull data directly into Growth OS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integration => (
          <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ${integration.iconColor}`} />
              <div>
                <h4 className="text-[14px] font-bold text-slate-900 mb-1">{integration.name}</h4>
                <p className="text-[12.5px] text-slate-500 leading-snug">{integration.description}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
              <button 
                className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors ${
                  integration.status === 'Connected' 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {integration.status}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
