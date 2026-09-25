"use client";

import { useState } from "react";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import ContentDetailDrawer from "@/components/dashboard/analytics/ContentDetailDrawer";
import FacebookIcon from "@/components/icons/FacebookIcon";
import { Search, ChevronUp, ChevronDown, Eye, Users, ThumbsUp, Activity } from "lucide-react";

export default function FacebookTab({
  social,
  fbContent,
  capabilities,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdTime");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const isUnavailable = capabilities?.social?.available === false;

  if (isUnavailable && !loading) {
    return (
      <CapabilityState
        title="Facebook Page Disconnected or Unavailable"
        description="Connect your Facebook Page to track page views, post engagement, reactions, and published content insights."
      />
    );
  }

  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  // Extract Page overview metrics
  const pageDetails = social?.data?.page?.details || {};
  const insights = social?.data?.page?.insights || [];

  const evaluateMetric = (insightsArray, metricName) => {
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
    const sum = valid.reduce((acc, v) => acc + Number(v.value), 0);
    return { status: "VALUE", value: sum };
  };

  const renderMetricState = (metricState) => {
    if (metricState.status === "VALUE") return formatSafeNumber(metricState.value);
    if (metricState.status === "NO_DATA") return "No data";
    return "Unavailable";
  };

  const fanCount = pageDetails.fanCount ?? pageDetails.followersCount;
  const pageViewsState = evaluateMetric(insights, "page_views_total");
  const pageImpressionsState = evaluateMetric(insights, "page_impressions");
  const postEngagementsState = evaluateMetric(insights, "page_post_engagements");

  const overviewCards = [
    { label: "Page Followers", value: formatSafeNumber(fanCount), icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Total Page Views", value: renderMetricState(pageViewsState), icon: Eye, color: "text-indigo-600 bg-indigo-50" },
    { label: "Page Impressions", value: renderMetricState(pageImpressionsState), icon: Activity, color: "text-purple-600 bg-purple-50" },
    { label: "Post Engagements", value: renderMetricState(postEngagementsState), icon: ThumbsUp, color: "text-pink-600 bg-pink-50" },
  ];

  // Process FB Content list
  const postsList = (fbContent?.data || []).map((item) => {
    const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
    return {
      contentId: item.contentId,
      platform: "facebook",
      caption: item.message || item.caption || "No message",
      createdTime: item.createdTime,
      date: item.createdTime ? new Date(item.createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      likes: normalizeNumber(item.metrics?.reactionCount ?? item.metrics?.likeCount),
      comments: normalizeNumber(item.metrics?.commentCount),
      shares: normalizeNumber(item.metrics?.shareCount),
      engagement: normalizeNumber(item.metrics?.fbPostInteractions),
      raw: item,
    };
  });

  const filteredPosts = postsList.filter((p) =>
    p.caption.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
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

      {/* Facebook Growth Chart */}
      <div>
        <TrendChart data={social?.data} capabilities={capabilities} loading={loading} activeTab="facebook" />
      </div>

      {/* Facebook Content Table */}
      <div className="dashboard-card p-6 overflow-hidden relative min-h-[360px] border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <FacebookIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-[15px] font-semibold text-slate-800">Facebook Content</h3>
            <span className="text-xs text-slate-400 font-medium ml-1">({sortedPosts.length} posts)</span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts..."
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
            <h4 className="text-[14px] font-semibold text-red-700 mb-1">Failed to load Facebook content</h4>
            <p className="text-[12.5px] text-red-500">{error}</p>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-semibold text-slate-700 mb-1">No Facebook posts found</h4>
            <p className="text-[12.5px] text-slate-500">
              {searchTerm ? "No posts matched your search criteria." : "No posts were published in the selected date range."}
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
                    Post Message
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
                      <span>Reactions</span>
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
                {sortedPosts.map((post, idx) => (
                  <tr
                    key={post.contentId}
                    onClick={() => setSelectedPost(post.raw)}
                    className={`border-b border-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors ${
                      idx % 2 === 1 ? "bg-slate-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800 max-w-[320px] truncate hover:text-blue-600 transition-colors">
                      {post.caption}
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate-500 whitespace-nowrap">{post.date}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800">{formatSafeNumber(post.likes)}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-slate-800">{formatSafeNumber(post.comments)}</td>
                    <td className="py-3.5 pr-4 text-[13px] font-semibold text-blue-600">{formatSafeNumber(post.engagement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Detail Drawer */}
      {selectedPost && (
        <ContentDetailDrawer item={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
