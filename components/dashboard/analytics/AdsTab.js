"use client";

import { useState } from "react";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import CampaignTable from "@/components/dashboard/analytics/CampaignTable";
import AdSetTable from "@/components/dashboard/analytics/AdSetTable";
import AdTable from "@/components/dashboard/analytics/AdTable";
import TrendChart from "@/components/dashboard/analytics/TrendChart";
import { Megaphone, ChevronRight, DollarSign, Eye, MousePointer, Target, TrendingUp, Layers, Tag } from "lucide-react";

export default function AdsTab({
  ads,
  campaigns,
  adSets,
  adsLevel,
  capabilities,
  loading,
  error,
  datasetErrors,
}) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdSet, setSelectedAdSet] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);

  const isAdsAvail = capabilities?.ads?.available === true;
  const isAdsDisabled = capabilities?.ads?.available === false && capabilities?.ads?.code === "REQUIREMENT_DISABLED";
  const isUnavailable = capabilities?.ads?.available === false;

  if (isUnavailable && !loading) {
    return (
      <CapabilityState
        title={isAdsDisabled ? "Meta Ads Not Enabled" : "Meta Ads Disconnected or Unavailable"}
        description={
          isAdsDisabled
            ? "Meta Ads capability is currently disabled for this integration."
            : "Connect a Meta Ad Account to track campaigns, ad sets, individual ad performance, spend, CTR, CPC, and conversions."
        }
      />
    );
  }

  const adsFallback = isAdsDisabled ? "Not enabled" : "Unavailable";
  const formatSafeCurrency = (val) => (val === null || val === undefined ? adsFallback : `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const formatSafeNumber = (val) => (val === null || val === undefined ? adsFallback : Number(val).toLocaleString());
  const formatSafePercent = (val) => (val === null || val === undefined ? adsFallback : `${Number(val).toFixed(2)}%`);

  // Aggregate Ads Overview metrics from backend `ads` payload
  const adsInsight = ads?.data?.insights?.[0] || ads?.data?.adsOverview || {};
  const spend = adsInsight.spend;
  const reach = adsInsight.reach;
  const impressions = adsInsight.impressions;
  const clicks = adsInsight.clicks;
  const ctr = adsInsight.ctr;
  const cpc = adsInsight.cpc;
  const cpm = adsInsight.cpm;

  let leads = "Unavailable";
  if (Array.isArray(adsInsight.actions)) {
    const leadAction = adsInsight.actions.find((a) => a.action_type === "lead");
    if (leadAction && Number.isFinite(parseFloat(leadAction.value))) {
      leads = parseFloat(leadAction.value);
    }
  }

  // Breadcrumb navigation handler
  const resetToLevel = (level) => {
    if (level === 0) {
      setSelectedCampaign(null);
      setSelectedAdSet(null);
      setSelectedAd(null);
    } else if (level === 1) {
      setSelectedAdSet(null);
      setSelectedAd(null);
    } else if (level === 2) {
      setSelectedAd(null);
    }
  };

  // Filter AdSets by selected campaign
  const filteredAdSets = selectedCampaign
    ? adSets.filter((a) => String(a.campaign_id || a.campaignId) === String(selectedCampaign.id || selectedCampaign.campaignId))
    : adSets;

  // Filter Ads by selected ad set or selected campaign
  const filteredAds = selectedAdSet
    ? adsLevel.filter((a) => String(a.adset_id || a.adSetId) === String(selectedAdSet.id || selectedAdSet.adset_id))
    : selectedCampaign
    ? adsLevel.filter((a) => String(a.campaign_id || a.campaignId) === String(selectedCampaign.id || selectedCampaign.campaignId))
    : adsLevel;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => resetToLevel(0)}
          className={`flex items-center gap-1.5 hover:text-indigo-600 transition-colors ${!selectedCampaign ? "text-indigo-600 font-bold" : ""}`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Ads Overview</span>
        </button>

        {selectedCampaign && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <button
              onClick={() => resetToLevel(1)}
              className={`hover:text-indigo-600 transition-colors truncate max-w-[160px] ${!selectedAdSet ? "text-indigo-600 font-bold" : ""}`}
              title={selectedCampaign.name}
            >
              Campaign: {selectedCampaign.name}
            </button>
          </>
        )}

        {selectedAdSet && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <button
              onClick={() => resetToLevel(2)}
              className={`hover:text-indigo-600 transition-colors truncate max-w-[160px] ${!selectedAd ? "text-indigo-600 font-bold" : ""}`}
              title={selectedAdSet.name}
            >
              Ad Set: {selectedAdSet.name}
            </button>
          </>
        )}

        {selectedAd && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <span className="text-indigo-600 font-bold truncate max-w-[160px]" title={selectedAd.name}>
              Ad: {selectedAd.name}
            </span>
          </>
        )}
      </div>

      {/* LEVEL 0: Ads Overview + Campaigns Table */}
      {!selectedCampaign && !selectedAdSet && !selectedAd && (
        <>
          {/* Overview KPI Header Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">Total Spend</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafeCurrency(spend)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">Impressions</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafeNumber(impressions)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">Reach</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafeNumber(reach)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">Clicks</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafeNumber(clicks)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">CTR</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafePercent(ctr)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">CPC</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatSafeCurrency(cpc)}</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs col-span-2 sm:col-span-1">
              <p className="text-[10.5px] font-semibold uppercase text-slate-400">Leads</p>
              <p className="text-lg font-bold text-indigo-600 mt-1">{formatSafeNumber(leads)}</p>
            </div>
          </div>

          {/* Ads Growth Chart */}
          <div>
            <TrendChart adsData={ads?.data} capabilities={capabilities} loading={loading} activeTab="ads" />
          </div>

          {/* Level 0: Active Campaigns Table */}
          <CampaignTable
            campaigns={campaigns}
            capabilities={capabilities}
            loading={loading}
            error={error || datasetErrors?.campaigns}
            onSelectCampaign={(c) => setSelectedCampaign(c)}
          />

          {/* Secondary AdSets overview table */}
          <AdSetTable
            data={adSets}
            capabilities={capabilities}
            loading={loading}
            error={datasetErrors?.adSets}
          />
        </>
      )}

      {/* LEVEL 1: Campaign Detail View */}
      {selectedCampaign && !selectedAdSet && !selectedAd && (
        <div className="space-y-6">
          <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  Campaign Detail
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedCampaign.name}</h2>
              </div>
              <button
                onClick={() => resetToLevel(0)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Back to All Campaigns
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Daily Budget</p>
                <p className="font-bold text-slate-800">{formatSafeCurrency(selectedCampaign.budget)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Total Spend</p>
                <p className="font-bold text-slate-800">{formatSafeCurrency(selectedCampaign.spend)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Total Clicks</p>
                <p className="font-bold text-slate-800">{formatSafeNumber(selectedCampaign.clicks)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Status</p>
                <p className="font-bold text-emerald-600">{selectedCampaign.status}</p>
              </div>
            </div>
          </div>

          {/* Child Ad Sets Table for Selected Campaign */}
          <AdSetTable
            data={filteredAdSets}
            capabilities={capabilities}
            loading={loading}
            error={datasetErrors?.adSets}
            onSelectAdSet={(adSet) => setSelectedAdSet(adSet)}
          />
        </div>
      )}

      {/* LEVEL 2: Ad Set Detail View */}
      {selectedAdSet && !selectedAd && (
        <div className="space-y-6">
          <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                  Ad Set Detail
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedAdSet.name}</h2>
              </div>
              <button
                onClick={() => resetToLevel(1)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Back to Campaign
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Spend</p>
                <p className="font-bold text-slate-800">{formatSafeCurrency(selectedAdSet.spend)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Impressions</p>
                <p className="font-bold text-slate-800">{formatSafeNumber(selectedAdSet.impressions)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Reach</p>
                <p className="font-bold text-slate-800">{formatSafeNumber(selectedAdSet.reach)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">Clicks</p>
                <p className="font-bold text-slate-800">{formatSafeNumber(selectedAdSet.clicks)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">CTR</p>
                <p className="font-bold text-indigo-600">{formatSafePercent(selectedAdSet.ctr)}</p>
              </div>
            </div>
          </div>

          {/* Child Ads Table for Selected Ad Set */}
          <AdTable
            data={filteredAds}
            capabilities={capabilities}
            loading={loading}
            error={datasetErrors?.adsLevel}
            onSelectAd={(ad) => setSelectedAd(ad)}
          />
        </div>
      )}

      {/* LEVEL 3: Ad Detail View */}
      {selectedAd && (
        <div className="space-y-6">
          <div className="dashboard-card p-6 border border-slate-200 rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700">
                  Individual Ad Detail
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedAd.name}</h2>
              </div>
              <button
                onClick={() => resetToLevel(2)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Back to Ad Set
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">Spend</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafeCurrency(selectedAd.spend)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">Impressions</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafeNumber(selectedAd.impressions)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">Reach</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafeNumber(selectedAd.reach)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">Clicks</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafeNumber(selectedAd.clicks)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">CTR</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafePercent(selectedAd.ctr)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">CPC</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{formatSafeCurrency(selectedAd.cpc)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl col-span-2 sm:col-span-1">
                <p className="text-[10.5px] font-semibold uppercase text-slate-400">CPM</p>
                <p className="text-base font-bold text-indigo-600 mt-0.5">{formatSafeCurrency(selectedAd.cpm)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
