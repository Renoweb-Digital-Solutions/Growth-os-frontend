"use client";

import Link from "next/link";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

export default function CapabilityState({
  title = "Capability Unavailable",
  description = "This platform is currently disconnected or unavailable.",
  actionText = "Manage Integration Settings",
  actionHref = "/dashboard/settings?tab=integrations",
  onReconnect,
  isReconnecting,
}) {
  return (
    <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-[16px] font-semibold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-[13px] text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>

      <div className="flex items-center gap-3">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <span>{actionText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {onReconnect && (
          <button
            onClick={onReconnect}
            disabled={isReconnecting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? "animate-spin text-indigo-600" : ""}`} />
            <span>{isReconnecting ? "Connecting..." : "Reconnect Meta"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
