"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import ContentDetailDrawer from "@/components/dashboard/analytics/ContentDetailDrawer";
import FacebookIcon from "@/components/icons/FacebookIcon";
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
  Eye,
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Compass,
  ThumbsUp,
  PlayCircle,
  Clock,
  ShieldCheck,
  Search,
  ChevronUp,
  ChevronDown,
  Check,
  MessageSquare,
  Share2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
  Table as TableIcon,
  Image as ImageIcon,
} from "lucide-react";
import { connectMeta } from "@/lib/metaApi";
import {
  formatDurationMinutes,
  evaluateDailySeries,
  evaluateMetricSummary,
  mapBackendTimeSeries,
  checkFallbackEligibility,
  resolveMetricWithFallback,
} from "@/lib/analyticsInsights";

export {
  formatDurationMinutes,
  evaluateDailySeries,
  evaluateMetricSummary,
  mapBackendTimeSeries,
  checkFallbackEligibility,
  resolveMetricWithFallback,
};

/**
 * Custom tooltip for the detailed metric trend chart
 */
function MetricDetailTooltip({ active, payload, label, unit = "" }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const displayLabel = dataPoint?.fullDate || dataPoint?.dateLabel || label;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl min-w-[170px] text-left">
        <p className="text-[11.5px] font-semibold text-slate-700 mb-1.5">{displayLabel}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-bold text-slate-800">
                {typeof item.value === "number" ? `${item.value.toLocaleString()}${unit}` : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Helper to format numbers safely without coercing null/undefined to zero
 */
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

const isPermissionError = (msg) => {
  if (!msg || typeof msg !== "string") return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("permission") ||
    lower.includes("reconnect") ||
    lower.includes("re-authorize") ||
    lower.includes("reauthorize") ||
    lower.includes("unauthorized") ||
    lower.includes("access token") ||
    lower.includes("oauth") ||
    lower.includes("expired")
  );
};

const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== "string") return "An error occurred while accessing Facebook insights.";
  return msg
    .replace(/(?:access_token|token|secret|client_secret|bearer)=?[^\s&]+/gi, "[REDACTED]")
    .replace(/EA[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]");
};


/**
 * Calculates previous-period change delta only when valid comparison data exists
 */
const calculatePeriodDelta = (currentSummary, previousSummary) => {
  if (!currentSummary || currentSummary.status !== "VALUE") return null;
  if (!previousSummary || previousSummary.status !== "VALUE") return null;

  const curr = currentSummary.value;
  const prev = previousSummary.value;

  if (prev === 0) {
    if (curr === 0) return { deltaPercent: 0, direction: "flat", text: "0.0% vs prev" };
    return { deltaPercent: null, direction: "up", text: "+100% vs prev (from 0)" };
  }

  const diff = curr - prev;
  const percent = Math.round((diff / prev) * 1000) / 10;
  const direction = percent > 0 ? "up" : percent < 0 ? "down" : "flat";
  const sign = percent > 0 ? "+" : "";

  return {
    deltaPercent: percent,
    direction,
    text: `${sign}${percent}% vs prev period`,
  };
};

/**
 * Maps comparison delta from backend structured comparison object { previousTotal, delta, percentageChange }
 */
const formatComparisonDelta = (comp) => {
  if (!comp) return null;
  const pct = comp.percentageChange ?? comp.deltaPercent;
  if (pct === null || pct === undefined || !Number.isFinite(Number(pct))) return null;
  const numPct = Number(pct);
  const direction = numPct > 0 ? "up" : numPct < 0 ? "down" : "flat";
  const sign = numPct > 0 ? "+" : "";
  return {
    deltaPercent: numPct,
    direction,
    text: `${sign}${numPct}% vs prev period`,
  };
};


export default function FacebookTab({
  fbAnalytics,
  social,
  fbContent,
  prevSocial,
  capabilities,
  loading,
  error,
  dateRange,
  onRetry,
  onReconnect,
  availablePages = [],
  selectedPageId = null,
  onSelectPage = null,
}) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    if (typeof onReconnect === "function") {
      return onReconnect();
    }
    try {
      setIsReconnecting(true);
      const res = await connectMeta();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Failed to initiate Meta reconnect:", err);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Independent selection per card
  const [cardSelections, setCardSelections] = useState({
    visibility: "views",
    engagement: "interactions",
    audience: "lifetime_followers",
    trends: "daily_views",
  });

  // Active metric displayed in the detailed Trend & Analysis panel below
  const [activeDetailMetricKey, setActiveDetailMetricKey] = useState("views");

  // Single global toggle to expand all 4 cards to show all metric rows simultaneously
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  // Compact dropdown open tracking per card
  const [openDropdownCardId, setOpenDropdownCardId] = useState(null);
  const dropdownContainersRef = useRef({});

  // Active page switcher dropdown state
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const pageDropdownRef = useRef(null);

  // Content table and detail states
  const [showDailyTable, setShowDailyTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdTime");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAllPostsOutsidePeriod, setShowAllPostsOutsidePeriod] = useState(false);
  const [visiblePostCount, setVisiblePostCount] = useState(10);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownCardId) {
        const el = dropdownContainersRef.current[openDropdownCardId];
        if (el && !el.contains(event.target)) {
          setOpenDropdownCardId(null);
        }
      }
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target)) {
        setIsPageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownCardId]);

  const isUnavailable = capabilities?.social?.available === false;

  // Active date bounds
  const activeSince = dateRange?.since || fbAnalytics?.meta?.dateRange?.since || social?.meta?.dateRange?.since || null;
  const activeUntil = dateRange?.until || fbAnalytics?.meta?.dateRange?.until || social?.meta?.dateRange?.until || null;
  const prevSince = dateRange?.prevSince || fbAnalytics?.meta?.dateRange?.previousPeriod?.since || null;
  const prevUntil = dateRange?.prevUntil || fbAnalytics?.meta?.dateRange?.previousPeriod?.until || null;
  const activeDays = dateRange?.days || fbAnalytics?.meta?.dateRange?.days || 28;

  // Dedicated endpoint structured groups
  const perf = fbAnalytics?.data?.performance;
  const video = fbAnalytics?.data?.video;
  const aud = fbAnalytics?.data?.audience;

  // Extract Page overview details and raw insights safely with useMemo
  const pageDetails = useMemo(() => {
    return (
      fbAnalytics?.data?.pageDetails ||
      fbAnalytics?.data?.page ||
      social?.data?.page?.details ||
      social?.data?.page ||
      {}
    );
  }, [fbAnalytics, social]);

  const currentInsights = useMemo(() => social?.data?.page?.insights || [], [social]);
  const previousInsights = useMemo(() => prevSocial?.data?.page?.insights || [], [prevSocial]);

  // Target page and dates for fallback eligibility
  const targetPageId = selectedPageId || fbAnalytics?.data?.pageDetails?.pageId || fbAnalytics?.data?.pageDetails?.id || fbAnalytics?.data?.page?.id;
  const socialPageId = social?.data?.page?.details?.pageId || social?.data?.page?.details?.id || social?.data?.pageId || social?.data?.page?.id;
  const targetSince = dateRange?.since || fbAnalytics?.meta?.dateRange?.since;
  const targetUntil = dateRange?.until || fbAnalytics?.meta?.dateRange?.until;
  const socialSince = social?.meta?.dateRange?.since;
  const socialUntil = social?.meta?.dateRange?.until;

  const isFallbackEligible = useMemo(() => {
    return checkFallbackEligibility({
      selectedPageId: targetPageId,
      socialPageId,
      targetSince,
      targetUntil,
      socialSince,
      socialUntil,
    });
  }, [targetPageId, socialPageId, targetSince, targetUntil, socialSince, socialUntil]);

  // Evaluate current and previous period for supported insight metrics
  const viewsCurrent = useMemo(() => {
    return resolveMetricWithFallback({
      perfMetric: perf?.views,
      insightsArray: currentInsights,
      metricNames: ["page_media_view", "page_views_total"],
      since: activeSince,
      until: activeUntil,
      isFallbackEligible,
    });
  }, [perf, currentInsights, activeSince, activeUntil, isFallbackEligible]);

  const viewsDelta = useMemo(() => {
    if (perf?.views?.comparison) {
      const formatted = formatComparisonDelta(perf.views.comparison);
      if (formatted) return formatted;
    }
    if (isFallbackEligible) {
      const viewsPrev = evaluateMetricSummary(previousInsights, ["page_media_view", "page_views_total"], prevSince, prevUntil);
      return calculatePeriodDelta(viewsCurrent, viewsPrev);
    }
    return null;
  }, [perf, viewsCurrent, previousInsights, prevSince, prevUntil, isFallbackEligible]);

  const reachCurrent = useMemo(() => {
    if (perf?.viewers) {
      // Backend perf.viewers queries daily uniques (page_total_media_view_unique with period=day)
      // and sums daily unique values. Multi-day sums of daily uniques cannot mathematically represent
      // deduplicated period-wide reach.
      // If the backend indicates it is a multi-day sum of daily uniques (daily series length > 1 and activeDays > 1),
      // render truthful UNAVAILABLE state rather than presenting the daily sum as deduplicated period reach.
      const hasDailySeries = Array.isArray(perf.viewers.timeSeries) && perf.viewers.timeSeries.length > 1;
      const isDailyUniqueMetric = perf.viewers.metricName === "page_total_media_view_unique" || perf.viewers.metricName === "page_impressions_unique";
      const isExplicitDeduplicated =
        perf.viewers.isDeduplicatedReach === true ||
        perf.viewers.reachPeriod === "total_over_range" ||
        perf.viewers.period === "total_over_range";
      const isAdditiveDailySum =
        !isExplicitDeduplicated &&
        hasDailySeries &&
        isDailyUniqueMetric &&
        activeDays > 1;

      if (isAdditiveDailySum) {
        return {
          status: "UNAVAILABLE",
          value: null,
          series: mapBackendTimeSeries(perf.viewers.timeSeries),
          reason: "Deduplicated period-wide reach is not provided by Meta Graph API for custom date ranges. Meta returns daily unique viewers, which cannot be mathematically summed across days without double-counting repeat viewers.",
        };
      }

      const status = perf.viewers.status === "AVAILABLE" && perf.viewers.total !== null && Number.isFinite(Number(perf.viewers.total))
        ? "VALUE"
        : perf.viewers.status === "EMPTY"
        ? "NO_DATA"
        : "UNAVAILABLE";
      return {
        status,
        value: perf.viewers.total,
        series: mapBackendTimeSeries(perf.viewers.timeSeries),
        reason: perf.viewers.reason,
      };
    }
    if (isFallbackEligible) {
      return evaluateMetricSummary(currentInsights, ["page_total_media_view_unique", "page_impressions_unique"], activeSince, activeUntil);
    }
    return { status: "UNAVAILABLE", value: null, series: [] };
  }, [perf, currentInsights, activeSince, activeUntil, activeDays, isFallbackEligible]);

  const reachDelta = useMemo(() => {
    if (reachCurrent.status === "UNAVAILABLE") {
      return null;
    }
    if (perf?.viewers?.comparison) {
      return formatComparisonDelta(perf.viewers.comparison);
    }
    if (isFallbackEligible) {
      const reachPrev = evaluateMetricSummary(previousInsights, ["page_total_media_view_unique", "page_impressions_unique"], prevSince, prevUntil);
      return calculatePeriodDelta(reachCurrent, reachPrev);
    }
    return null;
  }, [perf, reachCurrent, previousInsights, prevSince, prevUntil, isFallbackEligible]);

  const visitsCurrent = useMemo(() => {
    if (perf?.pageVisits && perf.pageVisits.status === "AVAILABLE" && perf.pageVisits.total !== null && Number.isFinite(Number(perf.pageVisits.total))) {
      return {
        status: "VALUE",
        value: perf.pageVisits.total,
        series: mapBackendTimeSeries(perf.pageVisits.timeSeries),
        metricName: perf.pageVisits.metricName || "page_visits",
      };
    }
    if (perf?.profileViews && perf.profileViews.status === "AVAILABLE" && perf.profileViews.total !== null && Number.isFinite(Number(perf.profileViews.total))) {
      return {
        status: "VALUE",
        value: perf.profileViews.total,
        series: mapBackendTimeSeries(perf.profileViews.timeSeries),
        metricName: "page_views_total",
      };
    }
    if (perf?.views && perf.views.metricName === "page_views_total" && perf.views.status === "AVAILABLE" && perf.views.total !== null && Number.isFinite(Number(perf.views.total))) {
      return {
        status: "VALUE",
        value: perf.views.total,
        series: mapBackendTimeSeries(perf.views.timeSeries),
        metricName: "page_views_total",
      };
    }
    // In Meta Graph API, Facebook Page profile visits is represented by page_views_total (viewsCurrent)
    // Only reuse viewsCurrent if it actually represents page_views_total (not page_media_view)
    if (viewsCurrent && viewsCurrent.status === "VALUE" && viewsCurrent.metricName !== "page_media_view" && perf?.views?.metricName !== "page_media_view") {
      return viewsCurrent;
    }
    if (isFallbackEligible) {
      return evaluateMetricSummary(currentInsights, ["page_views_total", "page_views_login_unique"], activeSince, activeUntil);
    }
    return { status: "UNAVAILABLE", value: null, series: [] };
  }, [perf, viewsCurrent, currentInsights, activeSince, activeUntil, isFallbackEligible]);

  const visitsDelta = useMemo(() => {
    if (perf?.pageVisits?.comparison) {
      const formatted = formatComparisonDelta(perf.pageVisits.comparison);
      if (formatted) return formatted;
    }
    if (perf?.profileViews?.comparison) {
      const formatted = formatComparisonDelta(perf.profileViews.comparison);
      if (formatted) return formatted;
    }
    if (viewsDelta && perf?.views?.metricName !== "page_media_view" && viewsCurrent?.metricName !== "page_media_view") {
      return viewsDelta;
    }
    if (perf?.views?.metricName === "page_views_total" && perf?.views?.comparison) {
      const formatted = formatComparisonDelta(perf.views.comparison);
      if (formatted) return formatted;
    }
    if (isFallbackEligible) {
      const visitsPrev = evaluateMetricSummary(previousInsights, ["page_views_total", "page_views_login_unique"], prevSince, prevUntil);
      return calculatePeriodDelta(visitsCurrent, visitsPrev);
    }
    return null;
  }, [perf, viewsDelta, viewsCurrent, visitsCurrent, previousInsights, prevSince, prevUntil, isFallbackEligible]);

  const videoViewsCurrent = useMemo(() => {
    if (video?.threeSecondViews) {
      const status = video.threeSecondViews.status === "AVAILABLE" ? "VALUE" : video.threeSecondViews.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      return {
        status,
        value: video.threeSecondViews.total,
        series: mapBackendTimeSeries(video.threeSecondViews.timeSeries),
      };
    }
    return evaluateMetricSummary(currentInsights, "page_video_views", activeSince, activeUntil);
  }, [video, currentInsights, activeSince, activeUntil]);

  const videoViewsDelta = useMemo(() => {
    if (video?.threeSecondViews?.comparison) {
      return formatComparisonDelta(video.threeSecondViews.comparison);
    }
    const videoViewsPrev = evaluateMetricSummary(previousInsights, "page_video_views", prevSince, prevUntil);
    return calculatePeriodDelta(videoViewsCurrent, videoViewsPrev);
  }, [video, videoViewsCurrent, previousInsights, prevSince, prevUntil]);

  const watchTimeCurrent = useMemo(() => {
    if (video?.watchTime) {
      const status = video.watchTime.status === "AVAILABLE" ? "VALUE" : video.watchTime.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      const totalMinutes = video.watchTime.totalMinutes ?? (typeof video.watchTime.totalMs === "number" ? Math.round(video.watchTime.totalMs / 60000) : null);
      return {
        status,
        value: totalMinutes,
        series: mapBackendTimeSeries(video.watchTime.timeSeries),
      };
    }
    return evaluateMetricSummary(currentInsights, "page_video_view_time", activeSince, activeUntil);
  }, [video, currentInsights, activeSince, activeUntil]);

  const watchTimeDelta = useMemo(() => {
    if (video?.watchTime?.comparison) {
      return formatComparisonDelta(video.watchTime.comparison);
    }
    const watchTimePrev = evaluateMetricSummary(previousInsights, "page_video_view_time", prevSince, prevUntil);
    return calculatePeriodDelta(watchTimeCurrent, watchTimePrev);
  }, [video, watchTimeCurrent, previousInsights, prevSince, prevUntil]);

  const engagementsCurrent = useMemo(() => {
    return resolveMetricWithFallback({
      perfMetric: perf?.postEngagements,
      insightsArray: currentInsights,
      metricNames: "page_post_engagements",
      since: activeSince,
      until: activeUntil,
      isFallbackEligible,
    });
  }, [perf, currentInsights, activeSince, activeUntil, isFallbackEligible]);

  const engagementsDelta = useMemo(() => {
    if (perf?.postEngagements?.comparison) {
      const formatted = formatComparisonDelta(perf.postEngagements.comparison);
      if (formatted) return formatted;
    }
    if (isFallbackEligible) {
      const engagementsPrev = evaluateMetricSummary(previousInsights, "page_post_engagements", prevSince, prevUntil);
      return calculatePeriodDelta(engagementsCurrent, engagementsPrev);
    }
    return null;
  }, [perf, engagementsCurrent, previousInsights, prevSince, prevUntil, isFallbackEligible]);

  // Snapshot: Lifetime followers
  const fanCount = aud?.lifetimeFollowers?.current ?? pageDetails.followersCount ?? pageDetails.fanCount;
  const lifetimeFollowersValue = fanCount !== null && fanCount !== undefined && Number.isFinite(Number(fanCount))
    ? Number(fanCount).toLocaleString()
    : "Unavailable";

  // Process FB Content list from structured endpoint or fallback content array
  const rawPosts = useMemo(() => {
    if (Array.isArray(fbAnalytics?.data?.posts) && fbAnalytics.data.posts.length > 0) {
      return fbAnalytics.data.posts;
    }
    if (Array.isArray(fbAnalytics?.data?.content?.posts) && fbAnalytics.data.content.posts.length > 0) {
      return fbAnalytics.data.content.posts;
    }
    if (Array.isArray(fbContent?.data)) {
      return fbContent.data;
    }
    return [];
  }, [fbAnalytics, fbContent]);

  const postsList = useMemo(() => {
    const normalizeNumber = (v) => (v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : null);
    return rawPosts.map((item) => {
      const contentId = item.contentId || item.id || item.postId;
      const permalinkUrl = item.permalinkUrl || item.permalink_url || item.permalink || null;
      const createdTime = item.createdTime || item.created_time || null;
      const rawViews = item.viewsDetails?.total ?? item.views ?? item.postMediaViews ?? item.metrics?.views ?? item.metrics?.postMediaViews;
      const views = normalizeNumber(rawViews);
      const viewsPeriod = item.viewsDetails?.period || item.viewsPeriod || (views !== null ? "lifetime" : null);

      return {
        contentId,
        platform: "facebook",
        caption: item.message || item.caption || "No message",
        createdTime,
        date: createdTime
          ? new Date(createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "N/A",
        fullPicture: item.fullPicture || item.full_picture || item.picture || null,
        permalinkUrl,
        reactions: normalizeNumber(item.reactions?.total ?? item.reactions ?? item.reactionCount ?? item.metrics?.reactionCount ?? item.metrics?.likeCount),
        comments: normalizeNumber(item.comments?.total ?? item.comments ?? item.commentCount ?? item.metrics?.commentCount),
        shares: normalizeNumber(item.shares?.total ?? item.shares ?? item.shareCount ?? item.metrics?.shareCount),
        uniqueMediaViewers: normalizeNumber(item.uniqueMediaViewers ?? item.metrics?.uniqueMediaViewers),
        reach: normalizeNumber(item.reach ?? item.metrics?.reach),
        views,
        viewsPeriod,
        postMediaViews: normalizeNumber(item.postMediaViews ?? item.metrics?.postMediaViews),
        interactions: normalizeNumber(item.interactions ?? item.metrics?.fbPostInteractions),
        engagement: normalizeNumber(item.engagement ?? item.metrics?.engagement),
        insightsError: item.insightsError || item.error || null,
        raw: item,
      };
    });
  }, [rawPosts]);

  // Filter posts within active date bounds if specified
  const periodPosts = useMemo(() => {
    return postsList.filter((p) => {
      if (!p.createdTime) return true;
      try {
        const iso = new Date(p.createdTime).toISOString().split("T")[0];
        if (activeSince && iso < activeSince) return false;
        if (activeUntil && iso > activeUntil) return false;
        return true;
      } catch (e) {
        return true;
      }
    });
  }, [postsList, activeSince, activeUntil]);

  // Aggregate post-level metrics from verified published content
  const evaluatePostAggregate = useCallback((extractor) => {
    if (rawPosts.length === 0) {
      return { status: "UNAVAILABLE", value: null, series: [] };
    }
    if (periodPosts.length === 0) {
      return { status: "NO_DATA", value: null, series: [] };
    }

    const validValues = periodPosts
      .map((p) => ({ val: extractor(p), time: p.createdTime }))
      .filter((item) => item.val !== null && item.val !== undefined && Number.isFinite(item.val));

    if (validValues.length === 0) {
      return { status: "UNAVAILABLE", value: null, series: [], reason: "Metric was not returned or is unavailable for posts in this period." };
    }

    const total = validValues.reduce((sum, item) => sum + item.val, 0);

    const dateMap = {};
    validValues.forEach((item) => {
      if (!item.time) return;
      try {
        const d = new Date(item.time);
        const iso = d.toISOString().split("T")[0];
        if (!dateMap[iso]) {
          dateMap[iso] = {
            dateKey: iso,
            dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            fullDate: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
            value: 0,
            timestamp: d.getTime(),
          };
        }
        dateMap[iso].value += item.val;
      } catch (e) {
        // Ignore unparseable date
      }
    });

    const series = Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
    return { status: "VALUE", value: total, series };
  }, [rawPosts, periodPosts]);

  const postInteractionsSummary = useMemo(() => evaluatePostAggregate((p) => p.interactions), [evaluatePostAggregate]);
  const postReactionsSummary = useMemo(() => evaluatePostAggregate((p) => p.reactions), [evaluatePostAggregate]);
  const postCommentsSummary = useMemo(() => evaluatePostAggregate((p) => p.comments), [evaluatePostAggregate]);
  const postSharesSummary = useMemo(() => evaluatePostAggregate((p) => p.shares), [evaluatePostAggregate]);

  // Follower metrics: Dedicated endpoint mapping + snapshot detection
  const perfFollows = perf?.follows || aud?.follows;

  const fallbackRawFollows = useMemo(() => {
    return evaluateMetricSummary(currentInsights, ["page_follows", "page_daily_follows", "page_daily_follows_unique"], activeSince, activeUntil);
  }, [currentInsights, activeSince, activeUntil]);

  const isFallbackSnapshot = useMemo(() => {
    if (!fallbackRawFollows || fallbackRawFollows.status !== "VALUE" || !fallbackRawFollows.series || fallbackRawFollows.series.length < 2) return false;
    const vals = fallbackRawFollows.series.map((s) => s.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return min > 100 && (max - min) < (min * 0.3);
  }, [fallbackRawFollows]);

  const followsCurrent = useMemo(() => {
    if (perfFollows) {
      const status = perfFollows.status === "AVAILABLE" ? "VALUE" : perfFollows.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      if (perfFollows.isSnapshot) {
        const periodChange = typeof perfFollows.periodChange === "number"
          ? perfFollows.periodChange
          : (typeof perfFollows.snapshotLatest === "number" && typeof perfFollows.snapshotEarliest === "number"
            ? perfFollows.snapshotLatest - perfFollows.snapshotEarliest
            : null);
        return {
          status: periodChange !== null ? "VALUE" : status,
          value: periodChange,
          series: mapBackendTimeSeries(perfFollows.timeSeries),
          isSnapshot: true,
          periodChange,
          snapshotLatest: perfFollows.snapshotLatest,
          snapshotEarliest: perfFollows.snapshotEarliest,
          note: perfFollows.note,
        };
      }
      return {
        status,
        value: perfFollows.total,
        series: mapBackendTimeSeries(perfFollows.timeSeries),
        isSnapshot: false,
      };
    }

    if (isFallbackSnapshot) {
      const series = fallbackRawFollows.series;
      const earliest = series[0].value;
      const latest = series[series.length - 1].value;
      const periodChange = latest - earliest;
      return {
        status: "VALUE",
        value: periodChange,
        series,
        isSnapshot: true,
        periodChange,
        snapshotLatest: latest,
        snapshotEarliest: earliest,
        note: "Values represent cumulative follower snapshots, not daily new follows. Total reflects period change between earliest and latest observations.",
      };
    }

    return fallbackRawFollows;
  }, [perfFollows, isFallbackSnapshot, fallbackRawFollows]);

  const followsDelta = useMemo(() => {
    if (perfFollows?.comparison) {
      return formatComparisonDelta(perfFollows.comparison);
    }
    const followsPrev = evaluateMetricSummary(previousInsights, ["page_follows", "page_daily_follows", "page_daily_follows_unique"], prevSince, prevUntil);
    return calculatePeriodDelta(followsCurrent, followsPrev);
  }, [perfFollows, followsCurrent, previousInsights, prevSince, prevUntil]);

  const perfUnfollows = perf?.unfollows || aud?.unfollows;
  const unfollowsCurrent = useMemo(() => {
    if (perfUnfollows) {
      const status = perfUnfollows.status === "AVAILABLE" ? "VALUE" : perfUnfollows.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      return {
        status,
        value: perfUnfollows.total,
        series: mapBackendTimeSeries(perfUnfollows.timeSeries),
        reason: perfUnfollows.reason,
      };
    }
    return evaluateMetricSummary(currentInsights, ["page_daily_unfollows_unique", "page_fan_removes_unique"], activeSince, activeUntil);
  }, [perfUnfollows, currentInsights, activeSince, activeUntil]);

  const unfollowsDelta = useMemo(() => {
    if (perfUnfollows?.comparison) {
      return formatComparisonDelta(perfUnfollows.comparison);
    }
    const unfollowsPrev = evaluateMetricSummary(previousInsights, ["page_daily_unfollows_unique", "page_fan_removes_unique"], prevSince, prevUntil);
    return calculatePeriodDelta(unfollowsCurrent, unfollowsPrev);
  }, [perfUnfollows, unfollowsCurrent, previousInsights, prevSince, prevUntil]);

  const perfNetFollows = perf?.netFollows || aud?.netFollows;
  const netFollowsSummary = useMemo(() => {
    if (perfNetFollows) {
      const status = perfNetFollows.status === "AVAILABLE" ? "VALUE" : perfNetFollows.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      return {
        status,
        value: perfNetFollows.total,
        series: mapBackendTimeSeries(perfNetFollows.timeSeries),
        reason: perfNetFollows.reason,
      };
    }
    if (followsCurrent.status === "VALUE" && unfollowsCurrent.status === "VALUE" && !followsCurrent.isSnapshot) {
      const netTotal = followsCurrent.value - unfollowsCurrent.value;
      const unfollowMap = new Map();
      unfollowsCurrent.series.forEach((u) => unfollowMap.set(u.dateKey, u.value));

      const netSeries = followsCurrent.series.map((f) => {
        const unfollowVal = unfollowMap.get(f.dateKey) || 0;
        return {
          ...f,
          value: f.value - unfollowVal,
        };
      });

      return {
        status: "VALUE",
        value: netTotal,
        series: netSeries,
      };
    }
    if (followsCurrent.isSnapshot) {
      return {
        status: "UNAVAILABLE",
        value: null,
        series: [],
        reason: "Net follows requires compatible daily flow metrics (e.g. page_daily_follows_unique). Cumulative follower snapshots (page_follows) already reflect net count and cannot be combined with daily unfollows.",
      };
    }
    if (followsCurrent.status === "NO_DATA" && unfollowsCurrent.status === "NO_DATA") {
      return { status: "NO_DATA", value: null, series: [] };
    }
    return { status: "UNAVAILABLE", value: null, series: [] };
  }, [perfNetFollows, followsCurrent, unfollowsCurrent]);

  const netFollowsDelta = useMemo(() => {
    if (perfNetFollows?.comparison) {
      return formatComparisonDelta(perfNetFollows.comparison);
    }
    return null;
  }, [perfNetFollows]);

  // Check whether backend contract supports Returning Viewers or Daily Net Follows
  const supportsReturningViewers = useMemo(() => {
    if (aud?.returningViewers) {
      return aud.returningViewers.status === "AVAILABLE";
    }
    return currentInsights.some((i) => (i.name === "page_returning_viewers" || i.name === "returning_viewers") && i.values?.length > 0);
  }, [aud, currentInsights]);

  const supportsDailyNetFollows = useMemo(() => {
    return netFollowsSummary.status === "VALUE" && netFollowsSummary.series.length > 0;
  }, [netFollowsSummary]);

  // Content Interactions resolution
  const resolvedContentInteractions = useMemo(() => {
    // If backend provides verified contentInteractions that is NOT a fallback to page_post_engagements
    if (perf?.contentInteractions && perf.contentInteractions.source !== "page_post_engagements") {
      const status = perf.contentInteractions.status === "AVAILABLE" ? "VALUE" : perf.contentInteractions.status === "EMPTY" ? "NO_DATA" : "UNAVAILABLE";
      return {
        status,
        value: perf.contentInteractions.total,
        series: mapBackendTimeSeries(perf.contentInteractions.timeSeries),
        delta: formatComparisonDelta(perf.contentInteractions.comparison),
        source: perf.contentInteractions.source || "contentInteractions",
      };
    }
    // Verified post-level interaction aggregation from published posts in period
    if (postInteractionsSummary.status === "VALUE") {
      return {
        ...postInteractionsSummary,
        source: "fbPostInteractions",
        delta: null,
      };
    }
    // Do not relabel page_post_engagements as content interactions:
    // If content interactions is unavailable or only available as page_post_engagements,
    // render truthful UNAVAILABLE state rather than relabeling post engagements
    return {
      status: "UNAVAILABLE",
      value: null,
      series: [],
      source: "none",
      delta: null,
      reason: "Content interactions (reactions, comments, shares, saves on content) is not provided by the current Page Insights query. Post engagements is available separately under Post Engagements.",
    };
  }, [perf, postInteractionsSummary]);

  const reactionsSummary = useMemo(() => {
    const bd = perf?.contentInteractions?.breakdown;
    if (bd && bd.reactions !== null && bd.reactions !== undefined) {
      return {
        status: "VALUE",
        value: bd.reactions,
        series: postReactionsSummary.series,
      };
    }
    return postReactionsSummary;
  }, [perf, postReactionsSummary]);

  const commentsSummary = useMemo(() => {
    const bd = perf?.contentInteractions?.breakdown;
    if (bd && bd.comments !== null && bd.comments !== undefined) {
      return {
        status: "VALUE",
        value: bd.comments,
        series: postCommentsSummary.series,
      };
    }
    return postCommentsSummary;
  }, [perf, postCommentsSummary]);

  const sharesSummary = useMemo(() => {
    const bd = perf?.contentInteractions?.breakdown;
    if (bd && bd.shares !== null && bd.shares !== undefined) {
      return {
        status: "VALUE",
        value: bd.shares,
        series: postSharesSummary.series,
      };
    }
    return postSharesSummary;
  }, [perf, postSharesSummary]);

  // Helper for computing daily average metric
  const computeDailyAverage = (summary) => {
    if (summary.status === "VALUE" && summary.series.length > 0) {
      const avg = Math.round((summary.value / summary.series.length) * 10) / 10;
      return {
        status: "VALUE",
        value: `${avg.toLocaleString()} / day`,
        numericAvg: avg,
        series: summary.series,
      };
    }
    return {
      status: summary.status,
      value: summary.status === "NO_DATA" ? "No data" : "Unavailable",
      numericAvg: null,
      series: summary.series || [],
    };
  };

  const dailyViews = useMemo(() => computeDailyAverage(viewsCurrent), [viewsCurrent]);
  const dailyInteractions = useMemo(() => computeDailyAverage(resolvedContentInteractions), [resolvedContentInteractions]);

  const dailyFollows = useMemo(() => {
    if (followsCurrent.isSnapshot) {
      if (typeof followsCurrent.periodChange === "number") {
        const days = followsCurrent.series.length > 0 ? followsCurrent.series.length : activeDays;
        const avg = Math.round((followsCurrent.periodChange / days) * 10) / 10;
        const sign = avg > 0 ? "+" : "";
        return {
          status: "VALUE",
          value: `${sign}${avg.toLocaleString()} / day (net rate)`,
          numericAvg: avg,
          series: followsCurrent.series,
        };
      }
      return {
        status: followsCurrent.status,
        value: followsCurrent.status === "NO_DATA" ? "No data" : "Unavailable",
        numericAvg: null,
        series: followsCurrent.series || [],
      };
    }
    return computeDailyAverage(followsCurrent);
  }, [followsCurrent, activeDays]);

  const dailyUnfollows = useMemo(() => {
    if (unfollowsCurrent.status === "VALUE") {
      return computeDailyAverage(unfollowsCurrent);
    }
    return {
      status: unfollowsCurrent.status,
      value: unfollowsCurrent.status === "NO_DATA" ? "No data" : "Unavailable",
      numericAvg: null,
      series: unfollowsCurrent.series || [],
    };
  }, [unfollowsCurrent]);

  const dailyNetFollows = useMemo(() => computeDailyAverage(netFollowsSummary), [netFollowsSummary]);

  // ==========================================================================
  // The 4 Authoritative Grouped KPI Cards
  // ==========================================================================
  const CARD_GROUPS = useMemo(() => {
    const formatValue = (summary, unit = "") => {
      if (summary.status === "VALUE") {
        return `${formatSafeNumber(summary.value)}${unit}`;
      }
      return summary.status === "NO_DATA" ? "No data" : "Unavailable";
    };

    // 1. Visibility & Reach
    const visibilityMetrics = [
      {
        key: "views",
        label: (perf?.views?.metricName === "page_media_view" || viewsCurrent?.metricName === "page_media_view") ? "Views" : "Page Views",
        category: "Visibility & Reach",
        value: formatValue(viewsCurrent),
        delta: viewsDelta,
        icon: Eye,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        accentHex: "#6366F1",
        supported: viewsCurrent.status !== "UNAVAILABLE",
        hasSeries: viewsCurrent.series.length > 0,
        series: viewsCurrent.series,
        summary: viewsCurrent,
        definition: (perf?.views?.metricName === "page_media_view" || viewsCurrent?.metricName === "page_media_view")
          ? "Total number of times your content (posts, videos, reels) was viewed during the selected reporting period (matching Views in Meta Business Suite Content Overview)."
          : "Total number of times your Facebook Page profile was viewed during the selected reporting period (displayed as Facebook visits in Meta Business Suite).",
        apiMetric: (perf?.views?.metricName === "page_media_view" || viewsCurrent?.metricName === "page_media_view") ? "page_media_view" : "page_views_total",
        unit: " views",
      },
      {
        key: "reach",
        label: "Viewers / Reach",
        category: "Visibility & Reach",
        value: formatValue(reachCurrent),
        delta: reachDelta,
        icon: Users,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        accentHex: "#3B82F6",
        supported: reachCurrent.status !== "UNAVAILABLE",
        hasSeries: reachCurrent.series.length > 0,
        series: reachCurrent.series,
        summary: reachCurrent,
        definition: "The number of unique people who had any content from your Page enter their screen (deduplicated across reporting period).",
        apiMetric: perf?.viewers?.metricName || "page_total_media_view_unique",
        unavailabilityReason: reachCurrent.reason || "The current backend Page Insights contract queries page_views_total and page_follows, but does not query page_impressions_unique or page_total_media_view_unique from Meta Graph API. Contact backend administrator or update metaService.js to enable reach metrics.",
        unit: " viewers",
      },
      {
        key: "visits",
        label: "Facebook Visits",
        category: "Visibility & Reach",
        value: formatValue(visitsCurrent),
        delta: visitsDelta,
        icon: Compass,
        color: "text-cyan-600 bg-cyan-50 border-cyan-200",
        accentHex: "#06B6D4",
        supported: visitsCurrent.status !== "UNAVAILABLE",
        hasSeries: visitsCurrent.series.length > 0,
        series: visitsCurrent.series,
        summary: visitsCurrent,
        definition: "Total number of times people visited your Page profile directly (sourced from page_views_total; displayed as Facebook visits in Meta Business Suite).",
        apiMetric: visitsCurrent.metricName || "page_views_total",
        unavailabilityReason: "Profile visits requires page_views_total from Meta Graph API.",
        unit: " visits",
      },
      {
        key: "video_views_3s",
        label: "3-second Video Views",
        category: "Visibility & Reach",
        value: formatValue(videoViewsCurrent),
        delta: videoViewsDelta,
        icon: PlayCircle,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        accentHex: "#F59E0B",
        supported: videoViewsCurrent.status !== "UNAVAILABLE",
        hasSeries: videoViewsCurrent.series.length > 0,
        series: videoViewsCurrent.series,
        summary: videoViewsCurrent,
        definition: "The number of times videos published by your Page were viewed for 3 seconds or longer, or for nearly their total length.",
        apiMetric: "page_video_views",
        unavailabilityReason: "Video metrics require page_video_views from Meta Graph API, which is not currently queried by the backend service.",
        unit: " views",
      },
      {
        key: "watch_time",
        label: "Watch Time",
        category: "Visibility & Reach",
        value: watchTimeCurrent.status === "VALUE"
          ? formatDurationMinutes(watchTimeCurrent.value)
          : (watchTimeCurrent.status === "NO_DATA" ? "No data" : "Unavailable"),
        delta: watchTimeDelta,
        icon: Clock,
        color: "text-orange-600 bg-orange-50 border-orange-200",
        accentHex: "#F97316",
        supported: watchTimeCurrent.status !== "UNAVAILABLE",
        hasSeries: watchTimeCurrent.series.length > 0,
        series: watchTimeCurrent.series,
        summary: watchTimeCurrent,
        definition: "Total time people spent watching your Page videos, displayed as hours and minutes (recorded in minutes).",
        apiMetric: "page_video_view_time",
        unavailabilityReason: "Watch time requires page_video_view_time from Meta Graph API, which is not currently queried by the backend service.",
        unit: "",
      },
    ];

    // 2. Engagement & Content
    const engagementMetrics = [
      {
        key: "interactions",
        label: "Content Interactions",
        category: "Engagement & Content",
        value: formatValue(resolvedContentInteractions),
        delta: resolvedContentInteractions.delta,
        icon: ThumbsUp,
        color: "text-purple-600 bg-purple-50 border-purple-200",
        accentHex: "#8B5CF6",
        supported: resolvedContentInteractions.status !== "UNAVAILABLE",
        hasSeries: resolvedContentInteractions.series.length > 0,
        series: resolvedContentInteractions.series,
        summary: resolvedContentInteractions,
        definition: "Total number of interactions (reactions, comments, and shares) across your published posts during the selected reporting period.",
        apiMetric: "fbPostInteractions (content aggregate)",
        unavailabilityReason: resolvedContentInteractions.reason || "Content interactions requires verified post interactions. Post engagements is available separately under Post Engagements.",
        unit: " interactions",
      },
      {
        key: "post_engagements",
        label: "Post Engagements",
        category: "Engagement & Content",
        value: formatValue(engagementsCurrent),
        delta: engagementsDelta,
        icon: TrendingUp,
        color: "text-violet-600 bg-violet-50 border-violet-200",
        accentHex: "#7C3AED",
        supported: engagementsCurrent.status !== "UNAVAILABLE",
        hasSeries: engagementsCurrent.series.length > 0,
        series: engagementsCurrent.series,
        summary: engagementsCurrent,
        definition: "Total number of reactions, comments, shares, and post engagements across all Page posts recorded in Page Insights.",
        apiMetric: "page_post_engagements",
        unit: " engagements",
      },
      {
        key: "reactions",
        label: "Reactions",
        category: "Engagement & Content",
        value: formatValue(reactionsSummary),
        delta: null,
        icon: ThumbsUp,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        accentHex: "#2563EB",
        supported: reactionsSummary.status !== "UNAVAILABLE",
        hasSeries: reactionsSummary.series.length > 0,
        series: reactionsSummary.series,
        summary: reactionsSummary,
        definition: "Total number of reactions (like, love, haha, wow, sad, angry) across your Facebook posts in the selected period.",
        apiMetric: "reactionCount / likeCount",
        unit: " reactions",
      },
      {
        key: "comments",
        label: "Comments",
        category: "Engagement & Content",
        value: formatValue(commentsSummary),
        delta: null,
        icon: MessageSquare,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        accentHex: "#D97706",
        supported: commentsSummary.status !== "UNAVAILABLE",
        hasSeries: commentsSummary.series.length > 0,
        series: commentsSummary.series,
        summary: commentsSummary,
        definition: "Total number of comments left by people on your Facebook posts in the selected period.",
        apiMetric: "commentCount",
        unit: " comments",
      },
      {
        key: "shares",
        label: "Shares",
        category: "Engagement & Content",
        value: formatValue(sharesSummary),
        delta: null,
        icon: Share2,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        accentHex: "#059669",
        supported: sharesSummary.status !== "UNAVAILABLE",
        hasSeries: sharesSummary.series.length > 0,
        series: sharesSummary.series,
        summary: sharesSummary,
        definition: "Total number of times your Facebook posts were shared by people in the selected period.",
        apiMetric: "shareCount",
        unit: " shares",
      },
    ];

    // 3. Audience & Followers
    const audienceMetrics = [
      {
        key: "lifetime_followers",
        label: "Lifetime Followers",
        category: "Audience & Followers",
        value: lifetimeFollowersValue,
        delta: null,
        icon: ShieldCheck,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        accentHex: "#2563EB",
        supported: fanCount !== null && fanCount !== undefined && Number.isFinite(Number(fanCount)),
        hasSeries: false,
        series: [],
        summary: { status: "VALUE", value: fanCount },
        definition: "All-time current total follower count for your Facebook Page (snapshot, not filtered by reporting period).",
        apiMetric: "fan_count / followers_count",
        isSnapshot: true,
      },
      {
        key: "follows",
        label: "Follows",
        category: "Audience & Followers",
        value: followsCurrent.isSnapshot
          ? (typeof followsCurrent.periodChange === "number"
              ? `${followsCurrent.periodChange >= 0 ? "+" : ""}${followsCurrent.periodChange.toLocaleString()}`
              : "No data")
          : formatValue(followsCurrent),
        delta: followsDelta,
        icon: UserPlus,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        accentHex: "#10B981",
        supported: followsCurrent.status !== "UNAVAILABLE",
        hasSeries: followsCurrent.series.length > 0,
        series: followsCurrent.series,
        summary: followsCurrent,
        isSnapshot: followsCurrent.isSnapshot,
        periodChange: followsCurrent.periodChange,
        snapshotLatest: followsCurrent.snapshotLatest,
        snapshotEarliest: followsCurrent.snapshotEarliest,
        dailyAvg: dailyFollows.numericAvg,
        badgeLabel: followsCurrent.isSnapshot ? "Snapshot-derived" : null,
        definition: followsCurrent.isSnapshot
          ? (followsCurrent.note || `Period follower change derived from daily snapshots (${followsCurrent.snapshotEarliest?.toLocaleString() ?? "start"} to ${followsCurrent.snapshotLatest?.toLocaleString() ?? "latest"}). Meta reports cumulative stock rather than direct flow.`)
          : "The number of new people who followed your Facebook Page during the selected period.",
        apiMetric: followsCurrent.isSnapshot ? "page_follows (snapshot-derived period change)" : "page_daily_follows_unique / page_follows",
        unit: followsCurrent.isSnapshot ? " net change" : " follows",
      },
      {
        key: "unfollows",
        label: "Unfollows",
        category: "Audience & Followers",
        value: formatValue(unfollowsCurrent),
        delta: unfollowsDelta,
        icon: UserMinus,
        color: "text-rose-600 bg-rose-50 border-rose-200",
        accentHex: "#F43F5E",
        supported: unfollowsCurrent.status !== "UNAVAILABLE",
        hasSeries: unfollowsCurrent.series.length > 0,
        series: unfollowsCurrent.series,
        summary: unfollowsCurrent,
        definition: "The number of people who unfollowed your Facebook Page during the selected period.",
        apiMetric: "page_daily_unfollows_unique",
        unavailabilityReason: unfollowsCurrent.reason || "Unfollows metric requires page_daily_unfollows_unique from Meta Graph API, which is not currently queried in the backend service. Metric remains explicitly unavailable to prevent fabricated churn numbers.",
        unit: " unfollows",
      },
      {
        key: "net_follows",
        label: "Net Follows",
        category: "Audience & Followers",
        value: formatValue(netFollowsSummary),
        delta: netFollowsDelta,
        icon: TrendingUp,
        color: "text-teal-600 bg-teal-50 border-teal-200",
        accentHex: "#14B8A6",
        supported: netFollowsSummary.status === "VALUE",
        hasSeries: netFollowsSummary.series.length > 0,
        series: netFollowsSummary.series,
        summary: netFollowsSummary,
        definition: "New follows minus unfollows during the selected period. Represents true net audience growth.",
        apiMetric: "page_follows - page_daily_unfollows_unique",
        unavailabilityReason: netFollowsSummary.reason || "Net Follows requires both new follows and unfollows time series. Because the backend does not supply unfollows data, Net Follows cannot be calculated without falsifying churn.",
        unit: " net follows",
      },
    ];

    // Conditionally include Returning Viewers only if the data contract supports it
    if (supportsReturningViewers) {
      const returningCurrent = evaluateMetricSummary(currentInsights, ["page_returning_viewers", "returning_viewers"], activeSince, activeUntil);
      audienceMetrics.push({
        key: "returning_viewers",
        label: "Returning Viewers",
        category: "Audience & Followers",
        value: formatValue(returningCurrent),
        delta: null,
        icon: Users,
        color: "text-cyan-600 bg-cyan-50 border-cyan-200",
        accentHex: "#06B6D4",
        supported: returningCurrent.status !== "UNAVAILABLE",
        hasSeries: returningCurrent.series.length > 0,
        series: returningCurrent.series,
        summary: returningCurrent,
        definition: "People who viewed your Page content again during the reporting period after having previously viewed it.",
        apiMetric: "page_returning_viewers",
        unit: " viewers",
      });
    }

    // 4. Performance Trends
    const trendsMetrics = [
      {
        key: "daily_views",
        label: "Daily Views",
        category: "Performance Trends",
        value: dailyViews.value,
        delta: viewsDelta,
        icon: Eye,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        accentHex: "#6366F1",
        supported: dailyViews.status === "VALUE",
        hasSeries: dailyViews.series.length > 0,
        series: dailyViews.series,
        summary: viewsCurrent,
        definition: "Average daily Page profile views and daily trend during the selected reporting period.",
        apiMetric: "page_views_total (daily avg & trend)",
        unit: " views/day",
      },
      {
        key: "daily_interactions",
        label: "Daily Content Interactions",
        category: "Performance Trends",
        value: dailyInteractions.value,
        delta: resolvedContentInteractions.delta,
        icon: ThumbsUp,
        color: "text-purple-600 bg-purple-50 border-purple-200",
        accentHex: "#8B5CF6",
        supported: dailyInteractions.status === "VALUE",
        hasSeries: dailyInteractions.series.length > 0,
        series: dailyInteractions.series,
        summary: resolvedContentInteractions,
        definition: "Average daily content interactions and daily activity trend during the selected reporting period.",
        apiMetric: "fbPostInteractions (daily avg & trend)",
        unit: " interactions/day",
      },
      {
        key: "daily_follows",
        label: "Daily Follows",
        category: "Performance Trends",
        value: dailyFollows.value,
        delta: followsDelta,
        icon: UserPlus,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        accentHex: "#10B981",
        supported: dailyFollows.status === "VALUE",
        hasSeries: dailyFollows.series.length > 0,
        series: dailyFollows.series,
        summary: followsCurrent,
        isSnapshot: followsCurrent.isSnapshot,
        periodChange: followsCurrent.periodChange,
        dailyAvg: dailyFollows.numericAvg,
        badgeLabel: followsCurrent.isSnapshot ? "Net rate" : null,
        definition: followsCurrent.isSnapshot
          ? `Average daily rate of follower growth derived from period snapshots (${typeof followsCurrent.periodChange === "number" && followsCurrent.periodChange >= 0 ? "+" : ""}${followsCurrent.periodChange ?? 0} over ${followsCurrent.series.length || activeDays} days).`
          : "Average daily new Page followers acquired and daily acquisition trend during the selected reporting period.",
        apiMetric: followsCurrent.isSnapshot ? "page_follows (daily net rate)" : "page_follows (daily avg & trend)",
        unit: followsCurrent.isSnapshot ? " net/day" : " follows/day",
      },
      {
        key: "daily_unfollows",
        label: "Daily Unfollows",
        category: "Performance Trends",
        value: dailyUnfollows.value,
        delta: unfollowsDelta,
        icon: UserMinus,
        color: "text-rose-600 bg-rose-50 border-rose-200",
        accentHex: "#F43F5E",
        supported: dailyUnfollows.status === "VALUE",
        hasSeries: dailyUnfollows.series.length > 0,
        series: dailyUnfollows.series,
        summary: unfollowsCurrent,
        definition: "Average daily Page unfollows and daily churn trend during the selected reporting period.",
        apiMetric: "page_daily_unfollows_unique (daily avg & trend)",
        unavailabilityReason: "Daily unfollows metric requires page_daily_unfollows_unique from Meta Graph API, which is not currently queried in the backend service. Metric remains explicitly unavailable to prevent fabricated churn numbers.",
        unit: " unfollows/day",
      },
    ];

    // Conditionally include Daily Net Follows only if the existing data supports it
    if (supportsDailyNetFollows) {
      trendsMetrics.push({
        key: "daily_net_follows",
        label: "Daily Net Follows",
        category: "Performance Trends",
        value: dailyNetFollows.value,
        delta: netFollowsDelta,
        icon: TrendingUp,
        color: "text-teal-600 bg-teal-50 border-teal-200",
        accentHex: "#14B8A6",
        supported: true,
        hasSeries: dailyNetFollows.series.length > 0,
        series: dailyNetFollows.series,
        summary: netFollowsSummary,
        definition: "Average daily net audience growth (daily follows minus daily unfollows) and trend during the selected reporting period.",
        apiMetric: "daily follows - daily unfollows",
        unit: " net/day",
      });
    }

    return [
      {
        id: "visibility",
        title: "Visibility & Reach",
        icon: Eye,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        metrics: visibilityMetrics,
      },
      {
        id: "engagement",
        title: "Engagement & Content",
        icon: ThumbsUp,
        color: "text-purple-600 bg-purple-50 border-purple-200",
        metrics: engagementMetrics,
      },
      {
        id: "audience",
        title: "Audience & Followers",
        icon: Users,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        metrics: audienceMetrics,
      },
      {
        id: "trends",
        title: "Performance Trends",
        icon: TrendingUp,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        metrics: trendsMetrics,
      },
    ];
  }, [
    viewsCurrent,
    viewsDelta,
    reachCurrent,
    reachDelta,
    visitsCurrent,
    visitsDelta,
    videoViewsCurrent,
    videoViewsDelta,
    watchTimeCurrent,
    watchTimeDelta,
    resolvedContentInteractions,
    engagementsCurrent,
    engagementsDelta,
    reactionsSummary,
    commentsSummary,
    sharesSummary,
    lifetimeFollowersValue,
    fanCount,
    followsCurrent,
    followsDelta,
    unfollowsCurrent,
    unfollowsDelta,
    netFollowsSummary,
    netFollowsDelta,
    supportsReturningViewers,
    dailyViews,
    dailyInteractions,
    dailyFollows,
    dailyUnfollows,
    dailyNetFollows,
    supportsDailyNetFollows,
    currentInsights,
    activeSince,
    activeUntil,
    activeDays,
    perf,
  ]);

  // Flattened list of all metrics across the 4 cards
  const allCardMetrics = useMemo(() => {
    return CARD_GROUPS.flatMap((g) => g.metrics);
  }, [CARD_GROUPS]);

  // Active selected metric object for the Trend & Analysis panel below
  const activeKpi = useMemo(() => {
    return allCardMetrics.find((c) => c.key === activeDetailMetricKey) || allCardMetrics[0];
  }, [allCardMetrics, activeDetailMetricKey]);

  // Selection handler for a specific card dropdown option
  const handleSelectMetric = (cardId, metricKey) => {
    setCardSelections((prev) => ({
      ...prev,
      [cardId]: metricKey,
    }));
    setActiveDetailMetricKey(metricKey);
    setOpenDropdownCardId(null);
  };

  // Filter backend notices: NEVER show an Instagram-only warning in a Facebook-only view
  const warnings = useMemo(() => {
    const rawWarnings = [
      ...(Array.isArray(fbAnalytics?.meta?.warnings) ? fbAnalytics.meta.warnings : []),
      ...(Array.isArray(fbAnalytics?.data?.warnings) ? fbAnalytics.data.warnings : []),
      ...(Array.isArray(social?.meta?.warnings) ? social.meta.warnings : []),
      ...(Array.isArray(social?.data?.warnings) ? social.data.warnings : []),
      ...(Array.isArray(fbContent?.meta?.warnings) ? fbContent.meta.warnings : []),
    ]
      .map((w) => (typeof w === "string" ? w : w?.message || String(w)))
      .filter(Boolean);

    return Array.from(new Set(rawWarnings)).filter((warn) => {
      const lower = warn.toLowerCase();
      if (lower.includes("instagram") && !lower.includes("facebook") && !lower.includes("page")) {
        return false;
      }
      return true;
    });
  }, [fbAnalytics, social, fbContent]);

  const displayPosts = useMemo(() => {
    if (showAllPostsOutsidePeriod) return postsList;
    return periodPosts;
  }, [showAllPostsOutsidePeriod, postsList, periodPosts]);

  const filterKey = `${searchTerm}_${showAllPostsOutsidePeriod}_${activeSince}_${activeUntil}_${selectedPageId}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisiblePostCount(10);
  }

  const filteredPosts = useMemo(() => {
    return displayPosts.filter((p) => p.caption.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [displayPosts, searchTerm]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (sortKey === "createdTime") {
        aVal = new Date(a.createdTime || 0).getTime();
        bVal = new Date(b.createdTime || 0).getTime();
      }
      if (sortKey === "views") {
        aVal = a.views ?? a.postMediaViews;
        bVal = b.views ?? b.postMediaViews;
      }
      if (sortKey === "uniqueMediaViewers" || sortKey === "reach") {
        aVal = a.uniqueMediaViewers ?? a.reach;
        bVal = b.uniqueMediaViewers ?? b.reach;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredPosts, sortKey, sortAsc]);

  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(0, visiblePostCount);
  }, [sortedPosts, visiblePostCount]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // Metric series calculations for detail panel
  const metricStats = useMemo(() => {
    if (!activeKpi.hasSeries || activeKpi.series.length === 0) return null;
    const series = activeKpi.series;
    if (activeKpi.isSnapshot) {
      const peak = series.reduce((max, s) => (s.value > max.value ? s : max), series[0]);
      const change = typeof activeKpi.periodChange === "number" ? activeKpi.periodChange : (activeKpi.summary?.value ?? 0);
      const avg = typeof activeKpi.dailyAvg === "number" ? activeKpi.dailyAvg : Math.round((change / series.length) * 10) / 10;
      return {
        total: change,
        totalLabel: "Period Change",
        avg,
        avgLabel: "Daily Net Rate",
        peak,
        peakLabel: "Peak Snapshot",
        count: series.length,
      };
    }
    const total = series.reduce((acc, s) => acc + s.value, 0);
    const avg = Math.round((total / series.length) * 10) / 10;
    const peak = series.reduce((max, s) => (s.value > max.value ? s : max), series[0]);

    return {
      total,
      totalLabel: "Period Total",
      avg,
      avgLabel: "Daily Average",
      peak,
      peakLabel: "Peak Day",
      count: series.length,
    };
  }, [activeKpi]);

  const formattedDateRange = useMemo(() => {
    if (activeSince && activeUntil) {
      try {
        const d1 = new Date(activeSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const d2 = new Date(activeUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return `${d1} – ${d2}`;
      } catch (e) {
        return `${activeSince} to ${activeUntil}`;
      }
    }
    return "Selected Date Range";
  }, [activeSince, activeUntil]);

  if (isUnavailable && !loading) {
    return (
      <CapabilityState
        title="Facebook Page Disconnected or Unavailable"
        description="Connect your Facebook Page in Settings to track page views, follower growth, content interactions, and detailed audience insights."
      />
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. Header Banner & Page Identity */}
      <div className="dashboard-card p-5 border border-slate-200 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <FacebookIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {pageDetails.name || "Facebook Page Analytics"}
              </h2>
              {pageDetails.category && (
                <span className="px-2 py-0.5 bg-blue-100/70 text-blue-700 text-[11px] font-semibold rounded-md">
                  {pageDetails.category}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Meta Business Suite insights &bull; Reporting period:{" "}
              <span className="font-semibold text-slate-700">{formattedDateRange}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Facebook Page Switcher (when multiple pages available) */}
          {availablePages && availablePages.length > 1 && onSelectPage && (
            <div className="relative" ref={pageDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPageDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-400 text-blue-700 text-[12px] font-semibold rounded-xl hover:bg-blue-50/50 transition-colors shadow-xs cursor-pointer"
                title="Switch Facebook Page"
              >
                <span>Switch Page ({availablePages.length})</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
              </button>

              {isPageDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl text-[12.5px] animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto">
                  <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Select Facebook Page
                  </div>
                  {availablePages.map((page) => {
                    const pId = String(page.pageId || page.id);
                    const isSelected = String(selectedPageId || pageDetails.pageId || pageDetails.id) === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          onSelectPage(pId);
                          setIsPageDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-[12.5px]">{page.name || `Page ${pId}`}</div>
                          {page.category && (
                            <div className="text-[10.5px] text-slate-400 font-normal truncate">{page.category}</div>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {pageDetails.link && (
            <a
              href={pageDetails.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[12px] font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              <span>View Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="Refresh Facebook Insights"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Non-Intrusive Notice Banner (Excludes Instagram-only warnings) */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-950">Facebook Page Insights Notice</span>
            {warnings.map((warn, i) => (
              <p key={i} className="text-[12px] text-amber-800 leading-relaxed">
                {warn}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 3. Section: Four Grouped KPI Cards with Single Global Toggle */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Overview Metrics</span>
              <span className="text-xs font-normal text-slate-400">
                (Click any card or metric row to inspect daily trend &amp; definition)
              </span>
            </h3>
          </div>

          {/* Single Global "Show all metrics" toggle replacing the previous carousel scroll buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
            <span
              id="show-all-metrics-label"
              onClick={() => setShowAllMetrics((prev) => !prev)}
              className="text-[12px] font-semibold text-slate-700 select-none cursor-pointer"
            >
              Show all metrics
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showAllMetrics}
              aria-labelledby="show-all-metrics-label"
              onClick={() => setShowAllMetrics((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                showAllMetrics ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span className="sr-only">Toggle all metrics</span>
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  showAllMetrics ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* The Exactly Four Grouped Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARD_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const selectedKey = cardSelections[group.id] || group.metrics[0]?.key;
            const selectedMetric = group.metrics.find((m) => m.key === selectedKey) || group.metrics[0];
            const isCardActive = activeDetailMetricKey && group.metrics.some((m) => m.key === activeDetailMetricKey);
            const isDropdownOpen = openDropdownCardId === group.id;

            return (
              <div
                key={group.id}
                ref={(el) => {
                  dropdownContainersRef.current[group.id] = el;
                }}
                className={`dashboard-card rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  showAllMetrics
                    ? "p-4 sm:p-4.5 bg-white border-slate-200 shadow-xs h-auto"
                    : isCardActive
                    ? "p-4.5 bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md cursor-pointer"
                    : "p-4.5 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs cursor-pointer"
                }`}
                onClick={() => {
                  if (!showAllMetrics) {
                    setActiveDetailMetricKey(selectedMetric.key);
                  }
                }}
              >
                {/* Card Top: Group Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${group.color}`}>
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 tracking-tight truncate">
                        {group.title}
                      </span>
                    </div>

                    {/* Badge */}
                    {showAllMetrics ? (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        {group.metrics.length} metrics
                      </span>
                    ) : selectedMetric.delta ? (
                      <div
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${
                          selectedMetric.delta.direction === "up"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : selectedMetric.delta.direction === "down"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedMetric.delta.direction === "up" && <TrendingUp className="w-2.5 h-2.5" />}
                        {selectedMetric.delta.direction === "down" && <TrendingDown className="w-2.5 h-2.5" />}
                        <span>{selectedMetric.delta.text.replace(" vs prev period", "")}</span>
                      </div>
                    ) : selectedMetric.badgeLabel ? (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md shrink-0">
                        {selectedMetric.badgeLabel}
                      </span>
                    ) : selectedMetric.isSnapshot ? (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        Snapshot
                      </span>
                    ) : !selectedMetric.supported ? (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md shrink-0">
                        API Limited
                      </span>
                    ) : null}
                  </div>

                  {/* Mode 1: Compact View (Toggle OFF) */}
                  {!showAllMetrics ? (
                    <div>
                      {/* Individual Dropdown Button */}
                      <div className="relative mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownCardId(isDropdownOpen ? null : group.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-wider py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span className="truncate max-w-[140px] sm:max-w-[160px]">{selectedMetric.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180 text-slate-700" : ""}`} />
                        </button>

                        {/* Dropdown Menu (Contains only metrics belonging to this card) */}
                        {isDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto scrollbar-light animate-in fade-in slide-in-from-top-1 duration-100">
                            {group.metrics.map((option) => (
                              <button
                                key={option.key}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectMetric(group.id, option.key);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-medium rounded-lg text-left transition-colors cursor-pointer ${
                                  selectedMetric.key === option.key
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <span className="truncate">{option.label}</span>
                                {selectedMetric.key === option.key && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Display Selected Metric Value */}
                      <div>
                        <p className={`text-2xl font-bold tracking-tight ${
                          selectedMetric.supported && selectedMetric.value !== "Unavailable" && selectedMetric.value !== "No data"
                            ? "text-slate-900"
                            : "text-slate-400 font-medium text-[16px] mt-1"
                        }`}>
                          {selectedMetric.value}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Expanded View (Toggle ON) - Displays all options in its own dropdown at the same time */
                    <div className="space-y-1.5 mt-2 pt-2.5 border-t border-slate-100">
                      {group.metrics.map((option) => {
                        const isRowSelected = selectedMetric.key === option.key;
                        const isDetailActive = activeDetailMetricKey === option.key;

                        return (
                          <div
                            key={option.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMetric(group.id, option.key);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isDetailActive
                                ? "bg-blue-50/90 border border-blue-200/90 shadow-2xs"
                                : isRowSelected
                                ? "bg-slate-50/90 border border-slate-200/80"
                                : "hover:bg-slate-50 border border-transparent"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[12px] font-semibold truncate ${isDetailActive ? "text-blue-900 font-bold" : "text-slate-700"}`}>
                                  {option.label}
                                </span>
                                {isDetailActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Active in Detail Chart" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                {option.apiMetric}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-[12.5px] font-bold ${
                                option.supported && option.value !== "Unavailable" && option.value !== "No data"
                                  ? isDetailActive ? "text-blue-700" : "text-slate-800"
                                  : "text-slate-400 font-medium"
                              }`}>
                                {option.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Bottom Ribbon (in compact mode) */}
                {!showAllMetrics && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate">{selectedMetric.label}</span>
                    {isCardActive && (
                      <span className="font-semibold text-blue-600 flex items-center gap-1">
                        Active
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Section: Clickable Detailed Analytics Panel */}
      <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-white shadow-xs">
        {/* Detail Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activeKpi.accentHex }}
              />
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                {activeKpi.label} Trend &amp; Analysis
              </h3>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-mono rounded-md">
                {activeKpi.apiMetric}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {activeKpi.definition}
            </p>
          </div>

          {activeKpi.hasSeries && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDailyTable(!showDailyTable)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-xl border transition-colors cursor-pointer ${
                  showDailyTable
                    ? "bg-slate-100 border-slate-300 text-slate-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{showDailyTable ? "Hide Daily Table" : "View Daily Table"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Metric Quick Stats Ribbon (When data exists) */}
        {metricStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-5">
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">{metricStats.totalLabel || "Period Total"}</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">
                {typeof metricStats.total === "number"
                  ? (metricStats.total >= 0 && activeKpi.isSnapshot ? `+${metricStats.total.toLocaleString()}` : metricStats.total.toLocaleString())
                  : metricStats.total}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">{metricStats.avgLabel || "Daily Average"}</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">
                {typeof metricStats.avg === "number"
                  ? (metricStats.avg >= 0 && activeKpi.isSnapshot ? `+${metricStats.avg.toLocaleString()}` : metricStats.avg.toLocaleString())
                  : metricStats.avg}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">{metricStats.peakLabel || "Peak Day"}</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block truncate">
                {metricStats.peak.value.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">{metricStats.peak.dateLabel}</span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block">Observations</span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">
                {metricStats.count} days
              </span>
            </div>
          </div>
        )}

        {/* Visual: Time Series Area Chart OR Honest Empty/Unavailable State */}
        <div className="mt-4">
          {activeKpi.hasSeries ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeKpi.series}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id={`grad-${activeKpi.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeKpi.accentHex} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={activeKpi.accentHex} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    interval={Math.max(0, Math.floor(activeKpi.series.length / 7))}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                    dx={-5}
                  />
                  <Tooltip content={<MetricDetailTooltip unit={activeKpi.unit} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={activeKpi.label}
                    stroke={activeKpi.accentHex}
                    strokeWidth={2.5}
                    fill={`url(#grad-${activeKpi.key})`}
                    dot={activeKpi.series.length <= 14 ? { r: 3, fill: activeKpi.accentHex } : false}
                    activeDot={{ r: 5, fill: activeKpi.accentHex, stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : activeKpi.supported && !activeKpi.isSnapshot ? (
            /* Supported but 0 observations returned */
            <div className="py-12 px-6 bg-slate-50 border border-slate-200/70 rounded-2xl text-center max-w-lg mx-auto my-4">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No time-series observations in this period</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Meta returned zero recorded daily events for {activeKpi.label} ({activeKpi.apiMetric}) between {activeSince || "start"} and {activeUntil || "end"}.
              </p>
            </div>
          ) : activeKpi.isSnapshot ? (
            /* Snapshot metric (e.g. Lifetime followers) */
            <div className="py-10 px-6 bg-blue-50/40 border border-blue-200/50 rounded-2xl text-center max-w-lg mx-auto my-4">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-blue-900">All-Time Page Snapshot</h4>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Lifetime Followers is an account-level cumulative snapshot ({activeKpi.value} followers). Daily trends are tracked under the &quot;Follows&quot; metric.
              </p>
            </div>
          ) : (
            /* Explicitly Unavailable Metric with honest contract explanation */
            <div className="py-10 px-6 bg-amber-50/50 border border-amber-200/70 rounded-2xl text-center max-w-lg mx-auto my-4">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-amber-900">Metric Not Available from Backend</h4>
              <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                {activeKpi.unavailabilityReason}
              </p>
              <div className="mt-3 inline-block bg-white/80 border border-amber-200 px-3 py-1 rounded-lg text-[11px] font-mono text-amber-800">
                Required Meta Graph API key: {activeKpi.apiMetric}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Daily Breakdown Data Table */}
        {showDailyTable && activeKpi.hasSeries && (
          <div className="mt-6 pt-5 border-t border-slate-100 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Daily Breakdown ({activeKpi.series.length} Days)
            </h4>
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold text-slate-600">Date</th>
                    <th className="py-2.5 px-3.5 font-semibold text-slate-600">Metric Value</th>
                    <th className="py-2.5 px-3.5 font-semibold text-slate-600">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeKpi.series.map((row) => {
                    const pct = metricStats?.total ? Math.round((row.value / metricStats.total) * 1000) / 10 : 0;
                    return (
                      <tr key={row.dateKey} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3.5 text-slate-700 font-medium">{row.fullDate}</td>
                        <td className="py-2 px-3.5 font-bold text-slate-900">{row.value.toLocaleString()}</td>
                        <td className="py-2 px-3.5 text-slate-500">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. Section: Audience Overview */}
      <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-5">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Audience Overview</span>
          </h3>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Page follower base and geographic demographics verified by Meta Graph API
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Page Fans</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {pageDetails.fanCount !== null && pageDetails.fanCount !== undefined ? pageDetails.fanCount.toLocaleString() : "Unavailable"}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">People who like your Facebook Page</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Follower Base</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {pageDetails.followersCount !== null && pageDetails.followersCount !== undefined ? pageDetails.followersCount.toLocaleString() : "Unavailable"}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">People who follow Page updates</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {followsCurrent.isSnapshot ? "Period Follower Change" : "New Follows (Period)"}
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {followsCurrent.status === "VALUE"
                ? (followsCurrent.isSnapshot
                    ? (typeof followsCurrent.periodChange === "number"
                        ? `${followsCurrent.periodChange >= 0 ? "+" : ""}${followsCurrent.periodChange.toLocaleString()}`
                        : "No data")
                    : followsCurrent.value.toLocaleString())
                : "Unavailable"}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {followsCurrent.isSnapshot ? "Net follower change in selected window" : "Follows acquired in selected window"}
            </span>
          </div>
        </div>

        {/* Demographics Honest Notice Panel */}
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block">Audience Demographics &amp; Geography</span>
            <p className="text-[11.5px] text-slate-500 leading-relaxed">
              Granular demographic distributions (Age, Gender, Top Cities, Top Countries) are not currently returned by the Facebook Page API contract. GrowthOS strictly avoids fabricating synthetic distributions when API data is not present.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Section: Recent Content & Reels Table */}
      <div className="dashboard-card p-6 overflow-hidden relative min-h-[380px] border border-slate-200 rounded-2xl bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <FacebookIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Recent Content &amp; Reels</h3>
            <span className="text-xs text-slate-400 font-semibold ml-1">
              ({sortedPosts.length} post{sortedPosts.length === 1 ? "" : "s"}{!showAllPostsOutsidePeriod ? " in period" : ""}{!showAllPostsOutsidePeriod && postsList.length !== sortedPosts.length ? `, ${postsList.length} total` : ""})
            </span>
            {showAllPostsOutsidePeriod && (
              <button
                type="button"
                onClick={() => setShowAllPostsOutsidePeriod(false)}
                className="ml-2 text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                (Reset to period filter)
              </button>
            )}
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

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-xs font-semibold text-slate-500">Loading published content insights...</span>
          </div>
        ) : error && postsList.length === 0 ? (
          isPermissionError(error) ? (
            <div className="text-center py-10 bg-amber-50 border border-amber-200 rounded-xl px-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h4 className="text-[14px] font-bold text-amber-900 mb-1">Facebook Permission or Authorization Required</h4>
              <p className="text-[12.5px] text-amber-700 max-w-md mx-auto mb-4">{sanitizeErrorMessage(error)}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12.5px] font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isReconnecting ? "Connecting..." : "Reconnect Facebook Account"}
                </button>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-red-50 border border-red-200 rounded-xl px-4">
              <h4 className="text-[14px] font-bold text-red-700 mb-1">Failed to load Facebook content</h4>
              <p className="text-[12.5px] text-red-500 mb-3">{sanitizeErrorMessage(error)}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          )
        ) : (
          <div>
            {/* Partial error notice if some datasets failed but posts succeeded */}
            {error && postsList.length > 0 && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-[12.5px] text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{sanitizeErrorMessage(error)}</span>
                </div>
                {isPermissionError(error) && (
                  <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            )}

            {/* Individual posts insights notice if any posts returned with insightsError */}
            {rawPosts.some((p) => p.insightsError) && (
              <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-[12px] text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Some post metrics could not be retrieved from Meta due to permission or API limitations. Re-authorizing your Facebook connection may enable missing metrics.</span>
                </div>
                <button
                  type="button"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="px-2.5 py-1 bg-amber-600 text-white text-[11px] font-semibold rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0 cursor-pointer"
                >
                  Re-authorize
                </button>
              </div>
            )}

            {/* Informational banner on lifetime post views vs period date filter */}
            <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-blue-900">
                  {showAllPostsOutsidePeriod
                    ? `Showing all ${postsList.length} posts for this Page.`
                    : `Showing posts published in the selected period (${formattedDateRange}).`}
                </p>
                <p className="text-blue-700 text-[11.5px] leading-relaxed">
                  Post <strong>Views</strong> reflect cumulative <strong>lifetime totals</strong> as reported by the Meta Graph API. Reactions, comments, and shares reflect totals for posts created during this window.
                </p>
              </div>
            </div>

            {sortedPosts.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 border border-slate-200 rounded-xl px-4">
                <h4 className="text-[14px] font-bold text-slate-700 mb-1">
                  {!searchTerm && postsList.length > 0 ? "No posts in selected period" : "No Facebook posts found"}
                </h4>
                <p className="text-[12.5px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  {searchTerm
                    ? "No posts matched your search criteria."
                    : postsList.length > 0
                    ? `No posts were published in the selected date range (${formattedDateRange}). ${postsList.length} post${postsList.length === 1 ? " exists" : "s exist"} outside this date range.`
                    : "No posts were published in the selected date range."}
                </p>
                {!searchTerm && postsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPostsOutsidePeriod(true)}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-blue-600 hover:text-blue-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>View all {postsList.length} post{postsList.length === 1 ? "" : "s"} outside period</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 pr-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Media</th>
                      <th
                        onClick={() => handleSort("caption")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                      >
                        Post Message
                      </th>
                      <th
                        onClick={() => handleSort("createdTime")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          {sortKey === "createdTime" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("reactions")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                      >
                        <div className="flex items-center gap-1">
                          <span>Reactions</span>
                          {sortKey === "reactions" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("comments")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                      >
                        <div className="flex items-center gap-1">
                          <span>Comments</span>
                          {sortKey === "comments" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("shares")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                      >
                        <div className="flex items-center gap-1">
                          <span>Shares</span>
                          {sortKey === "shares" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("views")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                        title="Lifetime views (post_media_view or post_total_media_view_unique) from Meta Graph API"
                      >
                        <div className="flex items-center gap-1">
                          <span>Views</span>
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 text-[9.5px] font-semibold rounded normal-case tracking-normal">
                            Lifetime
                          </span>
                          {sortKey === "views" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort("interactions")}
                        className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-600"
                        title="Interactions (Reactions + Comments + Shares, only when all components are available)"
                      >
                        <div className="flex items-center gap-1">
                          <span>Interactions</span>
                          {sortKey === "interactions" && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePosts.map((post, idx) => (
                      <tr
                        key={post.contentId}
                        onClick={() =>
                          setSelectedPost({
                            ...post.raw,
                            ...post,
                            contentId: post.contentId,
                            platform: "facebook",
                            permalinkUrl: post.permalinkUrl,
                            metrics: {
                              ...(post.raw?.metrics || {}),
                              reactionCount: post.reactions,
                              commentCount: post.comments,
                              shareCount: post.shares,
                              uniqueMediaViewers: post.uniqueMediaViewers,
                              reach: post.reach,
                              views: post.views,
                              postMediaViews: post.postMediaViews,
                              fbPostInteractions: post.interactions,
                              engagement: post.engagement,
                            },
                          })
                        }
                        className={`border-b border-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors ${
                          idx % 2 === 1 ? "bg-slate-50/20" : ""
                        }`}
                      >
                        <td className="py-3 pr-3">
                          {post.fullPicture ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.fullPicture}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800 max-w-[280px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate hover:text-blue-600 transition-colors" title={post.caption}>
                              {post.caption}
                            </span>
                            {post.permalinkUrl && (
                              <a
                                href={post.permalinkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open post on Facebook in new tab"
                                className="shrink-0 p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-[12px] text-slate-500 whitespace-nowrap">{post.date}</td>
                        <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">{formatTableCellNumber(post.reactions)}</td>
                        <td className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800">{formatTableCellNumber(post.comments)}</td>
                        <td
                          className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800"
                          title={
                            post.shares !== null && post.shares !== undefined
                              ? `${post.shares.toLocaleString()} shares`
                              : "Shares unavailable / not returned by Meta for this post"
                          }
                        >
                          {post.shares !== null && post.shares !== undefined ? (
                            post.shares.toLocaleString()
                          ) : (
                            <span className="text-slate-400 font-normal" title="Shares unavailable / not returned by Meta for this post">—</span>
                          )}
                        </td>
                        <td
                          className="py-3.5 pr-4 text-[12.5px] font-semibold text-slate-800"
                          title={
                            (post.views !== null && post.views !== undefined)
                              ? `Lifetime views: ${post.views.toLocaleString()} (cumulative total from Meta Graph API)`
                              : (post.uniqueMediaViewers !== null
                                ? `Unique media viewers: ${post.uniqueMediaViewers.toLocaleString()}`
                                : "Views unavailable for this post")
                          }
                        >
                          {formatTableCellNumber(post.views ?? post.postMediaViews ?? post.uniqueMediaViewers ?? post.reach)}
                        </td>
                        <td className="py-3.5 pr-4 text-[12.5px] font-bold text-blue-600" title="Reactions + Comments + Shares">
                          {formatTableCellNumber(post.interactions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination / Load more controls */}
            {sortedPosts.length > 10 && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  Showing {Math.min(visiblePostCount, sortedPosts.length)} of {sortedPosts.length} posts
                </span>
                <div className="flex items-center gap-2">
                  {visiblePostCount < sortedPosts.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setVisiblePostCount((prev) => Math.min(prev + 10, sortedPosts.length))}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        Load more (+10)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisiblePostCount(sortedPosts.length)}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Show all ({sortedPosts.length})
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVisiblePostCount(10)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Show less (10)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Post Detail Drawer */}
      {selectedPost && (
        <ContentDetailDrawer item={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
