"use client";

// Reason: Complete X (Twitter) Analytics tab providing verified Account Overview, Engagement,
// Content/Publishing, Historical Trends, and Recent Post Performance for the customer's own connected X account.
// How: Consumes useXAnalytics hook, aligns strictly with backend { success, data, meta } contracts,
//      handles live, cached, stale, empty, and disconnected states honestly without synthetic metric fabrication.

import { useState, useMemo } from "react";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import XIcon from "@/components/icons/XIcon";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Users,
  Eye,
  Heart,
  Repeat,
  MessageCircle,
  Quote,
  Bookmark,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  ChevronUp,
  ChevronDown,
  Calendar,
  Layers,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  Share2,
} from "lucide-react";

/**
 * Custom tooltip for daily activity trends
 */
function DailyActivityTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl min-w-[170px] text-left">
        <p className="text-[11.5px] font-semibold text-slate-700 mb-1.5">{dataPoint?.date || label}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-bold text-slate-800">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
          {dataPoint?.postCount !== undefined && (
            <div className="flex items-center justify-between gap-3 text-[11px] pt-1 border-t border-slate-100 text-slate-400">
              <span>Posts Published</span>
              <span className="font-semibold text-slate-600">{dataPoint.postCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function XTab({ xState }) {
  const {
    isConnected,
    account,
    analyticsData,
    meta,
    isLoadingStatus,
    isLoadingAnalytics,
    isLoading,
    error,
    connect,
    isConnecting,
    refresh,
  } = xState;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTrendMetric, setActiveTrendMetric] = useState("engagements");

  // Number formatting helper
  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  const formatTableCellNumber = (val) => {
    if (val === null || val === undefined) return "—";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "—";
    return parsed.toLocaleString();
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  // Safe extractions
  const audience = analyticsData?.audience || analyticsData?.account?.metrics || {};
  const comparison = analyticsData?.account?.comparison || {};
  const engagement = analyticsData?.engagement || {};
  const reach = analyticsData?.reach || {};
  const contentSummary = analyticsData?.contentSummary || {};
  const topPosts = analyticsData?.topPosts || [];
  const dailyActivity = analyticsData?.dailyActivity || [];
  const recentPosts = analyticsData?.recentPosts || [];

  const isStale = Boolean(analyticsData?.isStale || meta?.isStale);
  const staleReason = analyticsData?.staleReason || meta?.staleReason || "Serving previous snapshot due to API rate limit or refresh delay";

  // Filtered & sorted posts list
  const filteredPosts = useMemo(() => {
    const list = analyticsData?.recentPosts || [];
    return list.filter((post) => {
      const text = post.text || "";
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [analyticsData?.recentPosts, searchTerm]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else if (sortKey === "likes") {
        aVal = a.metrics?.likes ?? 0;
        bVal = b.metrics?.likes ?? 0;
      } else if (sortKey === "retweets") {
        aVal = a.metrics?.retweets ?? 0;
        bVal = b.metrics?.retweets ?? 0;
      } else if (sortKey === "replies") {
        aVal = a.metrics?.replies ?? 0;
        bVal = b.metrics?.replies ?? 0;
      } else if (sortKey === "impressions") {
        aVal = a.metrics?.impressions ?? 0;
        bVal = b.metrics?.impressions ?? 0;
      } else if (sortKey === "totalEngagements") {
        aVal = a.metrics?.totalEngagements ?? 0;
        bVal = b.metrics?.totalEngagements ?? 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredPosts, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // --------------------------------------------------------------------------
  // DISCONNECTED STATE
  // --------------------------------------------------------------------------
  if (!isConnected && !isLoadingStatus) {
    return (
      <CapabilityState
        title="X (Twitter) Account Disconnected"
        description="Connect your X account to track your audience, post engagements, impressions, video views, and daily performance trends."
        actionText="Connect X Account"
        actionHref="/dashboard/settings?tab=integrations"
        onReconnect={connect}
        isReconnecting={isConnecting}
      />
    );
  }

  // --------------------------------------------------------------------------
  // LOADING SKELETON
  // --------------------------------------------------------------------------
  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. Account Header Banner */}
      <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-black text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black border border-slate-700/80 flex items-center justify-center text-white shrink-0 overflow-hidden shadow-inner">
            {account?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.profileImageUrl}
                alt={account.name || "X Profile"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <XIcon className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {account?.name || "X Account Analytics"}
              </h2>
              {account?.username && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11.5px] font-mono rounded-md border border-slate-700">
                  @{account.username}
                </span>
              )}
            </div>
            {account?.description && (
              <p className="text-[12px] text-slate-300 mt-1 max-w-xl line-clamp-1 leading-relaxed">
                {account.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
              <span>Snapshot: <strong className="text-slate-200">{analyticsData?.snapshotDate || "Today"}</strong></span>
              <span>&bull;</span>
              <span>Last Refreshed: <strong className="text-slate-200">{formatTime(analyticsData?.fetchedAt || meta?.fetchedAt)}</strong></span>
              {meta?.source && (
                <>
                  <span>&bull;</span>
                  <span className="capitalize text-slate-300">
                    Source: {meta.source.replace(/_/g, " ")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {account?.username && (
            <a
              href={`https://x.com/${account.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold rounded-xl border border-white/10 transition-colors shadow-xs"
            >
              <span>View on X</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>
          )}
          {refresh && (
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors shadow-xs disabled:opacity-50"
              title="Refresh X Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? "animate-spin text-blue-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Stale Snapshot Warning Notice */}
      {isStale && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950 block">Serving Cached Snapshot</span>
            <p className="text-[12px] text-amber-800 leading-relaxed">
              {staleReason}
            </p>
            {meta?.lastSuccessfulRefresh && (
              <p className="text-[11px] text-amber-700 mt-1">
                Last successful live sync: {new Date(meta.lastSuccessfulRefresh).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. General Error Notice */}
      {error && !isStale && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">X Analytics Sync Notice</span>
            <p className="text-[12px] text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 4. Section 1: Account Overview Lifetime Metrics */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Account Overview</span>
          <span className="text-xs font-normal text-slate-400">(Lifetime counters &amp; period snapshot changes)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Followers */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Followers</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(audience.followersCount)}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Daily snapshot change</span>
              {comparison.followersDelta !== null && comparison.followersDelta !== undefined ? (
                <span className={`font-semibold flex items-center gap-0.5 ${comparison.followersDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {comparison.followersDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {comparison.followersDelta >= 0 ? `+${comparison.followersDelta}` : comparison.followersDelta}
                </span>
              ) : (
                <span className="text-slate-400">Baseline recorded</span>
              )}
            </div>
          </div>

          {/* Following */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Following</span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(audience.followingCount)}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Daily snapshot change</span>
              {comparison.followingDelta !== null && comparison.followingDelta !== undefined ? (
                <span className={`font-semibold flex items-center gap-0.5 ${comparison.followingDelta >= 0 ? "text-slate-700" : "text-slate-500"}`}>
                  {comparison.followingDelta >= 0 ? `+${comparison.followingDelta}` : comparison.followingDelta}
                </span>
              ) : (
                <span className="text-slate-400">Baseline recorded</span>
              )}
            </div>
          </div>

          {/* Public Posts Count */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Public Posts</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(audience.tweetCount)}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Daily snapshot change</span>
              {comparison.tweetCountDelta !== null && comparison.tweetCountDelta !== undefined ? (
                <span className="font-semibold text-emerald-600">
                  {comparison.tweetCountDelta >= 0 ? `+${comparison.tweetCountDelta}` : comparison.tweetCountDelta}
                </span>
              ) : (
                <span className="text-slate-400">Lifetime total</span>
              )}
            </div>
          </div>

          {/* Listed Count */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Listed In</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(audience.listedCount)}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Public lists added to</span>
              <span className="font-medium text-slate-500">Global</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 2: Engagement Overview */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Engagement Overview</span>
          <span className="text-xs font-normal text-slate-400">(Aggregated across observed posts)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Engagements */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Total Engagements</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(engagement.totalEngagements)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Likes + Reposts + Replies + Quotes + Bookmarks
            </p>
          </div>

          {/* Total Impressions */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Total Impressions</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatSafeNumber(reach.totalImpressions || engagement.totalImpressions)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Screen impressions across recent posts
            </p>
          </div>

          {/* Engagement Rate by Impressions */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Eng. Rate (Impressions)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {typeof engagement.engagementRateByImpressions === "number"
                ? `${engagement.engagementRateByImpressions.toFixed(2)}%`
                : "Unavailable"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Denominator: Total Impressions
            </p>
          </div>

          {/* Engagement Rate by Followers */}
          <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Eng. Rate (Followers)</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {typeof engagement.engagementRateByFollowers === "number"
                ? `${engagement.engagementRateByFollowers.toFixed(2)}%`
                : "Unavailable"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Denominator: Follower Base
            </p>
          </div>
        </div>

        {/* Detailed Engagement Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 block">Likes</span>
              <span className="text-sm font-bold text-slate-800">{formatSafeNumber(engagement.likes)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <Repeat className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 block">Reposts</span>
              <span className="text-sm font-bold text-slate-800">{formatSafeNumber(engagement.retweets)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 block">Replies</span>
              <span className="text-sm font-bold text-slate-800">{formatSafeNumber(engagement.replies)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <Quote className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 block">Quotes</span>
              <span className="text-sm font-bold text-slate-800">{formatSafeNumber(engagement.quotes)}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="text-[10.5px] uppercase font-semibold text-slate-400 block">Bookmarks</span>
              <span className="text-sm font-bold text-slate-800">{formatSafeNumber(engagement.bookmarks)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Section 3: Historical Trends Chart */}
      <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Daily Activity &amp; Performance Trends</span>
            </h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              UTC daily timeline aggregations across observed posts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTrendMetric("engagements")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTrendMetric === "engagements"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Engagements
            </button>
            <button
              onClick={() => setActiveTrendMetric("impressions")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTrendMetric === "impressions"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Impressions
            </button>
            <button
              onClick={() => setActiveTrendMetric("likes")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTrendMetric === "likes"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Likes
            </button>
          </div>
        </div>

        {dailyActivity.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="xTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={
                        activeTrendMetric === "impressions"
                          ? "#3B82F6"
                          : activeTrendMetric === "likes"
                          ? "#F43F5E"
                          : "#8B5CF6"
                      }
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        activeTrendMetric === "impressions"
                          ? "#3B82F6"
                          : activeTrendMetric === "likes"
                          ? "#F43F5E"
                          : "#8B5CF6"
                      }
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                />
                <Tooltip content={<DailyActivityTooltip />} />
                <Area
                  type="monotone"
                  dataKey={activeTrendMetric}
                  name={activeTrendMetric.charAt(0).toUpperCase() + activeTrendMetric.slice(1)}
                  stroke={
                    activeTrendMetric === "impressions"
                      ? "#3B82F6"
                      : activeTrendMetric === "likes"
                      ? "#F43F5E"
                      : "#8B5CF6"
                  }
                  strokeWidth={2.5}
                  fill="url(#xTrendGrad)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 px-6 bg-slate-50 border border-slate-200/70 rounded-2xl text-center max-w-md mx-auto">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Historical Trend Building</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Historical activity trends build daily as your X account remains connected. Recent activity will populate here as posts are published.
            </p>
          </div>
        )}
      </div>

      {/* 7. Section 4: Content & Publishing Summary */}
      <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Content &amp; Publishing Analytics</span>
          </h3>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Analysis of post composition and publishing frequency
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Publishing Frequency</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">
              {contentSummary.publishingFrequencyPerDay !== undefined
                ? `${contentSummary.publishingFrequencyPerDay} / day`
                : "Unavailable"}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Observed posting pace</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Posts Evaluated</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">
              {formatSafeNumber(contentSummary.totalPostsEvaluated)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Analyzed post sample</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Posts With Media</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">
              {formatSafeNumber(contentSummary.postsWithMedia)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Photos &amp; Videos included</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Video Views</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">
              {formatSafeNumber(contentSummary.videoViews || reach.totalVideoViews)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Summed video play counts</span>
          </div>
        </div>

        {/* Top Performing Posts Highlight */}
        {topPosts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Top Performing Posts</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topPosts.slice(0, 4).map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                        #{idx + 1} By Engagements
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(p.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-800 line-clamp-2 leading-relaxed">
                      {p.text}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-slate-500">
                    <span className="font-bold text-slate-800">
                      {p.totalEngagements?.toLocaleString()} engagements
                    </span>
                    {p.impressions > 0 && (
                      <span className="font-semibold text-blue-600">
                        {p.engagementRate}% rate
                      </span>
                    )}
                    {account?.username && (
                      <a
                        href={`https://x.com/${account.username}/status/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. Section 5: Recent Posts Table */}
      <div className="dashboard-card p-6 overflow-hidden relative min-h-[380px] border border-slate-200 rounded-2xl bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <XIcon className="w-5 h-5 text-black" />
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Recent Posts</h3>
            <span className="text-xs text-slate-400 font-semibold ml-1">({sortedPosts.length} posts)</span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search post text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {sortedPosts.length === 0 ? (
          <div className="text-center py-14 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-[14px] font-bold text-slate-700 mb-1">No posts found</h4>
            <p className="text-[12.5px] text-slate-500">
              {searchTerm ? "No posts matched your search criteria." : "No posts recorded in current snapshot."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      {sortKey === "createdAt" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Post Message
                  </th>
                  <th
                    onClick={() => handleSort("impressions")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Impressions</span>
                      {sortKey === "impressions" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("likes")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Likes</span>
                      {sortKey === "likes" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("retweets")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Reposts</span>
                      {sortKey === "retweets" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("replies")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Replies</span>
                      {sortKey === "replies" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("totalEngagements")}
                    className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      <span>Engagements</span>
                      {sortKey === "totalEngagements" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="pb-3 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map((post, idx) => {
                  const m = post.metrics || {};
                  return (
                    <tr
                      key={post.id || idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/20" : ""
                      }`}
                    >
                      <td className="py-3.5 pr-4 text-[12px] text-slate-500 whitespace-nowrap">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800 max-w-[320px]">
                        <p className="truncate">{post.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {post.hasMedia && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                              <Video className="w-2.5 h-2.5" /> Media
                            </span>
                          )}
                          {post.hasLinks && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                              Link
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">
                        {formatTableCellNumber(m.impressions)}
                      </td>
                      <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">
                        {formatTableCellNumber(m.likes)}
                      </td>
                      <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">
                        {formatTableCellNumber(m.retweets)}
                      </td>
                      <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">
                        {formatTableCellNumber(m.replies)}
                      </td>
                      <td className="py-3.5 pr-4 text-[12.5px] font-bold text-purple-600">
                        {formatTableCellNumber(m.totalEngagements)}
                      </td>
                      <td className="py-3.5 pr-3 text-right">
                        {account?.username ? (
                          <a
                            href={`https://x.com/${account.username}/status/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Open on X"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
