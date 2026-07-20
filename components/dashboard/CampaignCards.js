"use client";

import { MoreHorizontal } from "lucide-react";
import { campaignData } from "@/app/dashboard/mockData";

// Reason: Row of campaign cards for a quick overview of active marketing campaigns.
// How: Renders 4 campaign cards in a responsive grid. Each card shows an icon,
//      category tags, campaign name, and client name — mirroring the small
//      project-card style from the reference design.
// Receives: nothing (reads campaignData from mockData)
// Passes: nothing

export default function CampaignCards() {
  return (
    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {campaignData.map((campaign) => (
        <div
          key={campaign.id}
          className="dashboard-card p-5 hover:shadow-lg transition-shadow duration-300 group"
        >
          {/* Top row: icon + menu */}
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: campaign.iconBg }}
            >
              {campaign.icon}
            </div>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            {campaign.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10.5px] font-medium text-slate-500 bg-slate-100 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Campaign name */}
          <h4 className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug">
            {campaign.name}
          </h4>

          {/* Client */}
          <p className="text-[12px] text-slate-400">{campaign.client}</p>
        </div>
      ))}
    </div>
  );
}
