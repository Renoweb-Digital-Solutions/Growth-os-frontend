"use client";

import { useState } from "react";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import ContentDetailDrawer from "@/components/dashboard/analytics/ContentDetailDrawer";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { Search, ChevronUp, ChevronDown, Eye, Users, Heart, MessageSquare } from "lucide-react";

export default function InstagramTab({
  social,
  igContent,
  capabilities,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdTime");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const isUnavailable = capabilities?.instagram?.available === false;

  // Enforce mandatory Capability check: DO NOT render empty fake charts if Instagram is unavailable
  if (isUnavailable && !loading) {
    return (
      <CapabilityState
        title="Instagram Professional Account Unavailable"
        description="Instagram analytics require a connected Instagram Professional (Business or Creator) Account linked to your Facebook Page."
      />
    );
  }

  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  // Extract Instagram profile metrics
  const igInsights = social?.data?.instagram?.insights || [];

  const evaluateMetric = (insightsArray, metricName, mode = "sum") => {
    if (!insightsArray || !Array.isArray(insightsArray)) {
      return { status: "UNAVAILABLE" };
    }
    const item = insightsArray.find((i) => i.name === metricName);
    if (!item) {
      return { status: "UNAVAILABLE" };
    }
    if (!Array.isArray(item.values) || item.values.length === 0) {
      return { status: "NO_DATA" };
    }
    const valid = item.values.filter((v) => v.value !== null && v.value !== undefined);
    if (valid.length === 0) {
      return { status: "NO_DATA" };
    }
    if (mode === "avg") {
      const sum = valid.reduce((acc, v) => acc + Number(v.value), 0);
      return { status: "VALUE", value: Math.round(sum / valid.length) };
    }
    const sum = valid.reduce((acc, v) => acc + Number(v.value), 0);
    return { status: "VALUE", value: sum };
  };

  const renderMetricState = (metricState) => {
    if (metricState.status === "VALUE") return formatSafeNumber(metricState.value);
    if (metricState.status === "NO_DATA") return "No data";
    return "Unavailable";
  };

  const followersCount = social?.data?.instagram?.followersCount ?? social?.data?.instagram?.details?.followersCount;
  const impressionsState = evaluateMetric(igInsights, "impressions");
  const reachState = evaluateMetric(igInsights, "reach", "avg");
  const profileViewsState = evaluateMetric(igInsights, "profile_views");

  const overviewCards = [
    { label: "Followers", value: formatSafeNumber(followersCount), icon: Users, color: "text-pink-600 bg-pink-50" },
    { label: "Total Impressions", value: renderMetricState(impressionsState), icon: Eye, color: "text-purple-600 bg-purple-50" },
    { label: "Profile Views", value: renderMetricState(profileViewsState), icon: Heart, color: "text-amber-600 bg-amber-50" },
    { label: "Reach (Daily Avg)", value: renderMetricState(reachState), icon: Eye, color: "text-indigo-600 bg-indigo-50" },
  ];

  // Process IG Media list
  const mediaList = (igContent?.data || []).map((item) => {
    const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
    return {
      contentId: item.contentId,
      platform: "instagram",
      caption: item.caption || item.message || "No caption",
      createdTime: item.createdTime,
      date: item.createdTime ? new Date(item.createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      likes: normalizeNumber(item.metrics?.likeCount),
      comments: normalizeNumber(item.metrics?.commentCount),
      engagement: normalizeNumber(item.metrics?.igMediaInteractions),
      raw: item,
    };
  });

  const filteredMedia = mediaList.filter((m) =>
    m.caption.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMedia = [...filteredMedia].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === "createdTime") {
      aVal = new Date(a.createdTime || 0).getTime();
      bVal = new Date(b.createdTime || 0).getTime();
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="dashboard-card p-5 border border-slate-200 rounded-2xl flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instagram Growth Chart */}
      <div>
        <TrendChart data={social?.data} capabilities={capabilities} loading={loading} activeTab="instagram" />
      </div>

      {/* Instagram Media Table */}
      <div className="dashboard-card p-6 overflow-hidden relative min-h-[360px] border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <InstagramIcon className="w-5 h-5 text-pink-600" />
            <h3 className="text-[15px] font-semibold text-slate-800">Instagram Media Content</h3>
            <span className="text-xs text-slate-400 font-medium ml-1">({sortedMedia.length} posts)</span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 border border-red-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-red-700 mb-1">Failed to load Instagram media</h4>
            <p className="text-[12.5px] text-red-500">{error}</p>
          </div>
        ) : sortedMedia.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">No Instagram media found</h4>
            <p className="text-[12.5px] text-slate-500">
              {searchTerm ? "No media matched your search criteria." : "No posts were published on Instagram in the selected date range."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th
                    onClick={() => handleSort("caption")}
                    className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    Media Caption
                  </th>
                  <th
                    onClick={() => handleSort("createdTime")}
                    className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      {sortKey === "createdTime" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("likes")}
                    className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Likes</span>
                      {sortKey === "likes" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("comments")}
                    className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Comments</span>
                      {sortKey === "comments" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("engagement")}
                    className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Interactions</span>
                      {sortKey === "engagement" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMedia.map((media, idx) => (
                  <tr
                    key={media.contentId}
                    onClick={() => setSelectedMedia(media.raw)}
                    className={`border-b border-slate-50 hover:bg-pink-50/40 cursor-pointer transition-colors ${
                      idx % 2 === 1 ? "bg-slate-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800 max-w-[320px] truncate hover:text-pink-600 transition-colors">
                      {media.caption}
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate-500 whitespace-nowrap">{media.date}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800">{formatSafeNumber(media.likes)}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800">{formatSafeNumber(media.comments)}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-pink-600">{formatSafeNumber(media.engagement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Media Detail Drawer */}
      {selectedMedia && (
        <ContentDetailDrawer item={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}
    </div>
  );
}
