"use client";

import { useState, useEffect, useRef } from "react";
import { getMetaContentDetail, connectMeta } from "@/lib/metaApi";
import { X, ExternalLink, ThumbsUp, MessageSquare, Share2, Eye, Heart, Activity, AlertTriangle, Users } from "lucide-react";

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
  if (!msg || typeof msg !== "string") return "An error occurred while loading content details.";
  return msg
    .replace(/(?:access_token|token|secret|client_secret|bearer)=?[^\s&]+/gi, "[REDACTED]")
    .replace(/EA[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]");
};

export default function ContentDetailDrawer({ item, onClose }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const abortControllerRef = useRef(null);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      const res = await connectMeta();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Meta reconnection error:", err);
    } finally {
      setIsReconnecting(false);
    }
  };

  useEffect(() => {
    if (!item?.contentId) return;

    let isMounted = true;

    async function fetchDetail() {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await getMetaContentDetail(item.contentId, {
          signal: abortControllerRef.current.signal,
        });

        if (isMounted) {
          if (res?.success && res?.data) {
            // Dedicated endpoint response single object used when successful
            setDetailData(res.data);
          } else {
            setError(res?.error || "Failed to load detailed content insights from server.");
          }
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (isMounted) {
          // Explicitly set error state instead of silently masking API failures
          setError(err.message || "Failed to fetch detailed content insights.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [item?.contentId, retryCount]);

  if (!item) return null;

  const isMatchingDetail = detailData && (
    String(detailData.contentId) === String(item?.contentId) ||
    String(detailData.postId) === String(item?.contentId) ||
    String(detailData.mediaId) === String(item?.contentId)
  );
  const current = isMatchingDetail ? detailData : item;

  // Strict null semantics: Never convert null to 0
  const formatSafeNumber = (val) => {
    if (val === null || val === undefined || val === "") return "Unavailable";
    const parsed = Number(val);
    if (!Number.isFinite(parsed)) return "Unavailable";
    return parsed.toLocaleString();
  };

  const isFb = current.platform?.toLowerCase() === "facebook";
  const captionText = current.caption || current.message || "No text available for this content.";
  const publishedDate = current.createdTime
    ? new Date(current.createdTime).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unavailable";

  const thumbnail = current.fullPicture || current.mediaUrl;
  const metrics = current.metrics || {};

  const uniqueMediaViewersVal = metrics.uniqueMediaViewers ?? current.uniqueMediaViewers;
  const viewsVal = metrics.views ?? current.views ?? metrics.postMediaViews ?? current.postMediaViews;
  const reactionsVal = metrics.reactionCount ?? current.reactions ?? current.reactionCount ?? metrics.likeCount;
  const commentsVal = metrics.commentCount ?? current.comments ?? current.commentCount;
  const sharesVal = metrics.shareCount ?? current.shares ?? current.shareCount;
  const interactionsVal = metrics.fbPostInteractions ?? current.interactions ?? current.fbPostInteractions;
  const engagedUsersVal = metrics.engagement ?? current.engagement;
  const reachVal = metrics.reach ?? current.reach;
  const impressionsVal = metrics.impressions ?? current.impressions;

  const metricItems = isFb
    ? [
        {
          label: "Lifetime Views",
          value: formatSafeNumber(viewsVal),
          icon: Eye,
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Unique Media Viewers",
          value: formatSafeNumber(uniqueMediaViewersVal),
          icon: Eye,
          color: "text-purple-600 bg-purple-50",
        },
        {
          label: "Interactions",
          value: formatSafeNumber(interactionsVal),
          icon: Activity,
          color: "text-indigo-600 bg-indigo-50",
        },
        {
          label: "Reactions",
          value: formatSafeNumber(reactionsVal),
          icon: ThumbsUp,
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Comments",
          value: formatSafeNumber(commentsVal),
          icon: MessageSquare,
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Shares",
          value: formatSafeNumber(sharesVal),
          icon: Share2,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          label: "Engaged Users",
          value: formatSafeNumber(engagedUsersVal),
          icon: Users,
          color: "text-blue-600 bg-blue-50",
        },
        ...(reachVal !== null && reachVal !== undefined && reachVal !== uniqueMediaViewersVal
          ? [
              {
                label: "Reach",
                value: formatSafeNumber(reachVal),
                icon: Eye,
                color: "text-indigo-600 bg-indigo-50",
              },
            ]
          : []),
        {
          label: "Impressions",
          value: formatSafeNumber(impressionsVal),
          icon: Eye,
          color: "text-slate-600 bg-slate-100",
        },
      ]
    : [
        {
          label: "Total Engagement",
          value: formatSafeNumber(metrics.igMediaInteractions ?? metrics.engagement),
          icon: Activity,
          color: "text-indigo-600 bg-indigo-50",
        },
        {
          label: "Likes",
          value: formatSafeNumber(metrics.likeCount),
          icon: Heart,
          color: "text-pink-600 bg-pink-50",
        },
        {
          label: "Comments",
          value: formatSafeNumber(metrics.commentCount),
          icon: MessageSquare,
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Shares",
          value: formatSafeNumber(metrics.shareCount),
          icon: Share2,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          label: "Reach",
          value: formatSafeNumber(metrics.reach),
          icon: Eye,
          color: "text-purple-600 bg-purple-50",
        },
        {
          label: "Impressions",
          value: formatSafeNumber(metrics.impressions),
          icon: Eye,
          color: "text-slate-600 bg-slate-100",
        },
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  isFb ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                }`}
              >
                {current.platform || "Meta"}
              </span>
              <span className="text-[12px] text-slate-400 font-mono">
                ID: {current.contentId ? String(current.contentId).slice(-8) : "N/A"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="animate-spin w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            )}

            {/* Display error if detail request fails instead of silently swallowing */}
            {error && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-800 flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {isPermissionError(error) ? "Facebook Permission Required" : "Unable to load latest content details"}
                    </p>
                    <p className="mt-0.5 text-amber-700 text-[11.5px]">{sanitizeErrorMessage(error)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPermissionError(error) ? (
                    <button
                      onClick={handleReconnect}
                      disabled={isReconnecting}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isReconnecting ? "Connecting..." : "Reconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Display post-level insightsError notice if present on item */}
            {current.insightsError && !error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Post Insights Notice</p>
                  <p className="text-amber-700 text-[11px] mt-0.5">{sanitizeErrorMessage(current.insightsError)}</p>
                </div>
              </div>
            )}

            {/* Thumbnail */}
            {thumbnail && (
              <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnail}
                  alt="Post thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Post Message/Caption */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Caption / Message
              </h4>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {captionText}
              </div>
            </div>

            {/* Publication Date */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Published Date
              </h4>
              <p className="text-[13px] font-medium text-slate-700">{publishedDate}</p>
            </div>

            {/* Real Backend Metrics Grid */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Live Backend Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {metricItems.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10.5px] text-slate-400 uppercase font-semibold">{m.label}</p>
                        <p className="text-[13.5px] font-bold text-slate-800">{m.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {current.permalinkUrl ? (
              <a
                href={current.permalinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <span>View original post on {current.platform}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button disabled className="w-full py-2.5 bg-slate-200 text-slate-500 text-[13px] font-medium rounded-xl opacity-60">
                Permalink unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
