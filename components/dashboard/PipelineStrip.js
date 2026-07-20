"use client";

import { Plus, MoreHorizontal } from "lucide-react";
import { pipelineData } from "@/app/dashboard/mockData";

// Reason: Horizontal funnel strip showing deal pipeline stages with dollar values.
// How: Renders a row of stage cards connected by "+" and "..." separators,
//      each showing stage name, dollar value, and deal count. Horizontally
//      scrollable on small screens.
// Receives: nothing (reads pipelineData from mockData)
// Passes: nothing

export default function PipelineStrip() {
  return (
    <div className="col-span-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {pipelineData.map((stage, idx) => (
          <div key={stage.stage} className="flex items-center gap-2">
            {/* Stage card */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white rounded-xl border border-slate-200 min-w-max hover:shadow-md transition-shadow">
              <span className="text-[13.5px] font-semibold text-slate-800">
                {stage.stage}
              </span>
              <span className="text-[14px] font-bold text-slate-900">
                {stage.value}
              </span>
            </div>

            {/* Connector */}
            {idx < pipelineData.length - 1 && (
              <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
                <button className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
