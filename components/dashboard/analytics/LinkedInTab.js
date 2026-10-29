"use client";

import { useState } from "react";
import Link from "next/link";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import LinkedInAssetSelectionModal from "@/components/dashboard/settings/LinkedInAssetSelectionModal";
import {
  Megaphone,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  BarChart2,
  DollarSign,
  Eye,
  MousePointer,
  Users,
} from "lucide-react";

export default function LinkedInTab({ linkedInState, selectedRange }) {
  const {
    status,
    config,
    adsStatus,
    communityStatus,
    isAdsConnected,
    isCommunityConnected,
    isAnyConnected,
    isAdsApprovalPending,
    isCommunityApprovalPending,
    adsAssets,
    communityAssets,
    adsAssetsData,
    communityAssetsData,
    adsSelectedAsset,
    communitySelectedAsset,
    isLoadingStatus,
    isLoadingAssets,
    refresh,
    selectAsset,
    connect,
  } = linkedInState;

  // Active sub-tab: 'ads' (Growmentum) or 'community' (Growmentum-community)
  const [activeSubTab, setActiveSubTab] = useState("ads");
  const [activeModalApp, setActiveModalApp] = useState(null);
  const [showDevSpecs, setShowDevSpecs] = useState(false);

  // Range label helper
  const rangeDisplay =
    typeof selectedRange === "object" && selectedRange?.isCustom
      ? `${selectedRange.startDate} to ${selectedRange.endDate}`
      : typeof selectedRange === "string"
      ? selectedRange.toUpperCase()
      : typeof selectedRange === "number"
      ? `${selectedRange}D`
      : "30D";

  // If neither app is connected and not loading, display clear capability state
  if (!isAnyConnected && !isLoadingStatus) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0077b5] mb-4 shadow-sm">
          <LinkedInIcon className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1.5">LinkedIn Integration Disconnected</h3>
        <p className="text-[13px] text-slate-500 max-w-lg mb-6 leading-relaxed">
          Connect your LinkedIn apps in Integration Settings to manage Advertising accounts (Growmentum)
          and Company Pages (Growmentum-community) directly within Growth OS.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard/settings?tab=integrations"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] text-white text-[13px] font-semibold rounded-xl hover:bg-[#006097] transition-colors shadow-sm"
          >
            <span>Manage LinkedIn in Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Check Status</span>
          </button>
        </div>
      </div>
    );
  }

  const isCurrentAppConnected = activeSubTab === "ads" ? isAdsConnected : isCommunityConnected;
  const currentStatus = activeSubTab === "ads" ? adsStatus : communityStatus;
  const currentApprovalPending = activeSubTab === "ads" ? isAdsApprovalPending : isCommunityApprovalPending;
  const currentSelectedAsset = activeSubTab === "ads" ? adsSelectedAsset : communitySelectedAsset;
  const currentAssets = activeSubTab === "ads" ? adsAssets : communityAssets;
  const currentAssetsData = activeSubTab === "ads" ? adsAssetsData : communityAssetsData;
  const isCurrentLoadingAssets = activeSubTab === "ads" ? isLoadingAssets.ads : isLoadingAssets.community;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-tab Navigation: Advertising vs Community */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("ads")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "ads"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Growmentum (Advertising API)</span>
            {isAdsConnected ? (
              <span
                className={`w-2 h-2 rounded-full ${
                  isAdsApprovalPending ? "bg-amber-400" : "bg-emerald-400"
                }`}
                title={isAdsApprovalPending ? "Approval Pending" : "Connected"}
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" title="Disconnected" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("community")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "community"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Growmentum-community (Pages)</span>
            {isCommunityConnected ? (
              <span
                className={`w-2 h-2 rounded-full ${
                  isCommunityApprovalPending ? "bg-amber-400" : "bg-emerald-400"
                }`}
                title={isCommunityApprovalPending ? "Approval Pending" : "Connected"}
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" title="Disconnected" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-[11.5px] text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Active Period: <strong className="text-slate-700">{rangeDisplay}</strong></span>
        </div>
      </div>

      {/* Integration Status Bar */}
      <div className="dashboard-card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0077b5] shrink-0">
              <LinkedInIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-slate-900">
                  {activeSubTab === "ads" ? "Growmentum (Advertising API)" : "Growmentum-community (Pages API)"}
                </h3>
                {isLoadingStatus ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                    Checking...
                  </span>
                ) : isCurrentAppConnected && !currentApprovalPending ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Connected
                  </span>
                ) : isCurrentAppConnected && currentApprovalPending ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Approval Pending
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-500">
                    Disconnected
                  </span>
                )}
              </div>

              <p className="text-[12.5px] text-slate-500 mt-0.5">
                {activeSubTab === "ads"
                  ? "B2B Advertising API access for Ad Accounts, campaigns, spend, and ad conversions."
                  : "Community Management API access for Company Pages, page engagement, and follower metrics."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentAppConnected ? (
              <button
                onClick={() => connect(activeSubTab)}
                className="px-4 py-2 bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Connect {activeSubTab === "ads" ? "Growmentum" : "Growmentum-community"}
              </button>
            ) : (
              <Link
                href="/dashboard/settings?tab=integrations"
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Manage in Settings
              </Link>
            )}
          </div>
        </div>

        {/* Connected OpenID Member Banner (when connected) */}
        {isCurrentAppConnected && currentStatus?.member && (
          <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Connected Member:</span>
              <span className="font-bold text-slate-900">{currentStatus.member.name}</span>
              {currentStatus.member.email && (
                <span className="text-slate-400">({currentStatus.member.email})</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>OpenID Connect Verified (Member ID: {currentStatus.member.id})</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Asset Banner & Selector */}
      {isCurrentAppConnected && (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
              {activeSubTab === "ads" ? <Megaphone className="w-4 h-4 text-purple-600" /> : <Building2 className="w-4 h-4 text-blue-600" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Selected {activeSubTab === "ads" ? "Ad Account" : "Company Page"}
              </span>
              {currentSelectedAsset ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-[13.5px] font-bold text-slate-900">{currentSelectedAsset.name}</h4>
                  {currentSelectedAsset.currency && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-purple-50 text-purple-700 rounded border border-purple-200">
                      {currentSelectedAsset.currency}
                    </span>
                  )}
                  {currentSelectedAsset.vanityName && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                      @{currentSelectedAsset.vanityName}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-slate-500 italic mt-0.5">
                  {currentAssets.length === 0
                    ? `No authorized ${activeSubTab === "ads" ? "ad accounts" : "company pages"} discovered yet.`
                    : `No ${activeSubTab === "ads" ? "ad account" : "company page"} currently selected.`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModalApp(activeSubTab)}
              disabled={currentAssets.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Switch {activeSubTab === "ads" ? "Ad Account" : "Page"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {currentAssets.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Approval Pending Warning Callout */}
      {isCurrentAppConnected && currentApprovalPending && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-[13px]">
              LinkedIn Developer Portal Approval Pending ({activeSubTab === "ads" ? "Advertising API" : "Community Management API"})
            </h4>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              {currentAssetsData?.message ||
                (activeSubTab === "ads"
                  ? "LinkedIn Advertising API access is subject to product approval. Basic OpenID member identity is authenticated, but ad accounts and advertising reporting require LinkedIn review approval for the r_ads permission."
                  : "LinkedIn Community Management API requires organization verification and product access approval. Basic OpenID member identity is authenticated, but company pages and organic post insights require r_organization_social permission.")}
            </p>
            <div className="pt-1.5 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="text-amber-600 font-sans font-semibold">Required Scopes:</span>
              {(currentAssetsData?.requiredScopes || (activeSubTab === "ads" ? ["r_ads", "r_ads_reporting"] : ["r_organization_social", "r_organization_admin"])).map((scope) => (
                <span key={scope} className="px-1.5 py-0.5 bg-amber-100/80 rounded border border-amber-200 text-amber-800">
                  {scope}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1 vs PHASE 2 DATA AVAILABILITY TRANSPARENCY CARD */}
      <div className="dashboard-card p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phase 1 Implementation Active — Analytics Reporting Roadmap
              </h3>
              <p className="text-[12px] text-slate-500">
                OAuth 2.0 authentication, token management, and asset discovery are fully live.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDevSpecs((prev) => !prev)}
            className="text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{showDevSpecs ? "Hide Phase 2 Specs" : "View Phase 2 Specs"}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDevSpecs ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Transparency Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[12px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Phase 1 Deliverables (Active & Verified)
            </span>
            <ul className="text-slate-600 space-y-1 pl-5 list-disc text-[11.5px] leading-relaxed">
              <li>Independent dual-app OAuth for <code>Growmentum</code> & <code>Growmentum-community</code></li>
              <li>OpenID Connect member identification & profile verification</li>
              <li>Automated token refresh & token storage isolation</li>
              <li>Asset discovery for Ad Accounts & Organization Pages</li>
              <li>User-scoped active asset persistence via backend API</li>
            </ul>
          </div>

          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
            <span className="font-bold text-blue-900 flex items-center gap-1.5 text-[12px]">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Phase 2 Deliverables (Pending Reporting API)
            </span>
            <p className="text-blue-800/80 text-[11.5px] leading-relaxed">
              LinkedIn analytics reporting endpoints will be integrated in Phase 2 once backend reporting services
              (e.g. ad campaign breakdowns, company updates, impressions, and engagement rates) are implemented.
              No synthetic or fabricated metrics are presented.
            </p>
          </div>
        </div>

        {/* Collapsible Developer Specifications for Phase 2 Reporting Endpoints */}
        {showDevSpecs && (
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-200">
            <h4 className="font-bold text-slate-800 text-[12px]">
              Required Backend Phase 2 Reporting Endpoints Specification
            </h4>
            <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto space-y-1.5">
              <p className="text-emerald-400">// Advertising API Reporting Route (Phase 2):</p>
              <p>GET /api/linkedin/ads/insights?adAccountId=:id&datePreset=30d&since=:date&until=:date</p>
              <p className="text-slate-400 pl-4">→ Expected fields: spend, impressions, reach, clicks, ctr, cpc, cpm, conversions</p>
              <p className="text-emerald-400 mt-2">// Community Management API Reporting Route (Phase 2):</p>
              <p>GET /api/linkedin/community/insights?organizationUrn=:urn&since=:date&until=:date</p>
              <p className="text-slate-400 pl-4">→ Expected fields: impressions, uniqueImpressions, clicks, reactions, comments, shares, followerGains</p>
            </div>
          </div>
        )}
      </div>

      {/* METRICS PREVIEW CONTAINER (Zero Fake Numbers / Honest Awaiting State) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {activeSubTab === "ads" ? "Advertising Performance Metrics" : "Organization Social Metrics"}
          </h3>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Awaiting Phase 2 Reporting API
          </span>
        </div>

        {activeSubTab === "ads" ? (
          /* Advertising KPI Shell */
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Spend", icon: DollarSign, unit: "USD" },
              { label: "Impressions", icon: Eye, unit: "Views" },
              { label: "Clicks", icon: MousePointer, unit: "Clicks" },
              { label: "CTR", icon: TrendingUp, unit: "%" },
              { label: "Avg. CPC", icon: DollarSign, unit: "USD" },
              { label: "Conversions", icon: CheckCircle2, unit: "Actions" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider">{kpi.label}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-300">--</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Phase 2 Reporting</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Community KPI Shell */
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Followers", icon: Users, unit: "Members" },
              { label: "Impressions", icon: Eye, unit: "Views" },
              { label: "Unique Reach", icon: Eye, unit: "Uniques" },
              { label: "Reactions", icon: TrendingUp, unit: "Reactions" },
              { label: "Comments", icon: MousePointer, unit: "Comments" },
              { label: "Engagement Rate", icon: BarChart2, unit: "%" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider">{kpi.label}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-300">--</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Phase 2 Reporting</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Polished Empty Reporting Shell */}
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-[14px] font-bold text-slate-800">
              No Reporting Metrics Available for {activeSubTab === "ads" ? "LinkedIn Ads" : "LinkedIn Community"}
            </h4>
            <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
              {currentApprovalPending
                ? "This account is awaiting LinkedIn Developer Portal product approval. Once the API product is granted and approved by LinkedIn, reporting endpoints will populate live campaign and organic insights."
                : "The backend Phase 1 integration is active and verified for OAuth & asset discovery. Real-time reporting metrics will display here automatically once Phase 2 reporting endpoints are delivered."}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Selection Modal */}
      {activeModalApp && (
        <LinkedInAssetSelectionModal
          isOpen={!!activeModalApp}
          onClose={() => setActiveModalApp(null)}
          appType={activeModalApp}
          assets={activeModalApp === "ads" ? adsAssets : communityAssets}
          selectedId={
            activeModalApp === "ads"
              ? adsSelectedAsset?.assetId || adsStatus?.selectedAssetId
              : communitySelectedAsset?.assetId || communityStatus?.selectedAssetId
          }
          approvalStatus={
            activeModalApp === "ads" ? adsStatus?.approvalStatus : communityStatus?.approvalStatus
          }
          apiAccessAvailable={
            activeModalApp === "ads"
              ? adsAssetsData?.apiAccessAvailable
              : communityAssetsData?.apiAccessAvailable
          }
          message={
            activeModalApp === "ads" ? adsAssetsData?.message : communityAssetsData?.message
          }
          onSelectAsset={async (id) => {
            await selectAsset(activeModalApp, id);
            setActiveModalApp(null);
          }}
        />
      )}
    </div>
  );
}
