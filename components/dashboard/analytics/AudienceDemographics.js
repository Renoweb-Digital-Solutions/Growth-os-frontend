"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Reason: Audience demographics visualization — age horizontal bars + gender donut.
// How: Renders horizontal bar chart (pure CSS) for age groups side-by-side with a
//      small Recharts donut for gender split.
// Receives: `ageData` (audienceAge array), `genderData` (audienceGender array)
//           from analytics/page.js
// Passes: nothing

export default function AudienceDemographics({ ageData, genderData }) {
  return (
    <div className="dashboard-card p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
        Audience Demographics
      </h3>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Age groups — horizontal bars */}
        <div className="flex-1">
          <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Age Groups
          </p>
          <div className="space-y-3">
            {ageData.map((item) => (
              <div key={item.group} className="flex items-center gap-3">
                <span className="text-[12px] text-slate-500 w-[40px]">
                  {item.group}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-[12px] font-semibold text-slate-700 w-[32px] text-right">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender donut */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Gender
          </p>
          <div className="w-[120px] h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {genderData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2">
            {genderData.map((item) => (
              <span key={item.name} className="flex items-center gap-1 text-[11px] text-slate-500">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name} {item.value}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
