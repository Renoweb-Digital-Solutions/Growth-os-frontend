"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// Reason: Donut chart showing traffic/engagement split by marketing channel.
// How: Recharts PieChart with inner/outer radius to create donut. Custom legend
//      with percentages rendered beside the chart.
// Receives: `data` (channelBreakdown array) from analytics/page.js
// Passes: nothing

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
        <span className="text-[12px] font-semibold text-slate-800">
          {payload[0].name}: {payload[0].value}%
        </span>
      </div>
    );
  }
  return null;
}

export default function ChannelDonut({ data }) {
  return (
    <div className="dashboard-card p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
        Channel Breakdown
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[12.5px] text-slate-600">{item.name}</span>
              </div>
              <span className="text-[12.5px] font-semibold text-slate-800">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
