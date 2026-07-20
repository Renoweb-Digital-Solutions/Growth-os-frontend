"use client";

import { MoreHorizontal } from "lucide-react";
import { activityFeedData } from "@/app/dashboard/mockData";

// Reason: Shows a live-looking activity feed of recent marketing events.
// How: Iterates over activityFeedData to render each event with an avatar,
//      description, user name, and relative timestamp.
// Receives: nothing (reads activityFeedData from mockData)
// Passes: nothing

export default function ActivityFeed() {
  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800">
          Activity Feed
        </h3>
        <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        {activityFeedData.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[13px] font-semibold"
              style={{ backgroundColor: item.avatarColor }}
            >
              {item.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-700 leading-snug">
                <span className="font-semibold text-slate-800">
                  {item.name}
                </span>{" "}
                {item.action}
              </p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
