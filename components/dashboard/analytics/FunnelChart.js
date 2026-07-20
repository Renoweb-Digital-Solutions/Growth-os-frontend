"use client";

// Reason: Horizontal funnel visualization — Impressions → Clicks → Leads → Conversions.
// How: Custom CSS-based stepped bars (not a standard Recharts chart type). Each stage
//      shows its value and the drop-off percentage from the previous stage.
// Receives: `data` (funnelData array) from analytics/page.js
// Passes: nothing

const stageColors = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981"];

export default function FunnelChart({ data }) {
  const maxVal = data[0]?.value || 1;

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
        Conversion Funnel
      </h3>

      <div className="space-y-3">
        {data.map((stage, idx) => {
          const widthPercent = Math.max((stage.value / maxVal) * 100, 8);
          const dropOff =
            idx > 0
              ? (((data[idx - 1].value - stage.value) / data[idx - 1].value) * 100).toFixed(1)
              : null;

          return (
            <div key={stage.stage}>
              {/* Drop-off indicator */}
              {dropOff && (
                <div className="flex items-center gap-2 mb-1.5 ml-2">
                  <span className="text-[10.5px] text-red-400 font-medium">
                    ↓ {dropOff}% drop-off
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Bar */}
                <div className="flex-1 h-10 bg-slate-50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg flex items-center px-4 transition-all duration-700"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stageColors[idx],
                    }}
                  >
                    <span className="text-[12px] font-semibold text-white whitespace-nowrap">
                      {stage.stage}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <span className="text-[14px] font-bold text-slate-800 w-[80px] text-right">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
