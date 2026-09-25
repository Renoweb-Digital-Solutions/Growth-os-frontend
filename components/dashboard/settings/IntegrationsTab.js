"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { integrations } from "@/app/dashboard/settings/mockSettings";
import {
  getMetaStatus,
  connectMeta,
  disconnectMeta,
  getMetaAssets,
} from "@/lib/metaApi";
import { useMetaAssetSelection } from "@/hooks/useMetaAssetSelection";
import MetaAssetSelectionModal from "@/components/dashboard/settings/MetaAssetSelectionModal";
import FacebookIcon from "@/components/icons/FacebookIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { ChevronRight, Megaphone, CheckCircle2, SlidersHorizontal } from "lucide-react";

export default function IntegrationsTab() {
  const [metaStatus, setMetaStatus] = useState({
    connected: false,
    status: "loading",
    metaUserId: null,
    grantedScopes: [],
  });

  const [assets, setAssets] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Asset selection state & modal management
  const [activeModalCategory, setActiveModalCategory] = useState(null);
  const { selectedAssets, selectPage, selectInstagram, selectAdAccount } = useMetaAssetSelection(assets);

  const abortControllerRef = useRef(null);

  // Fetch status and assets helper
  const fetchStatusAndAssets = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const options = { signal: abortControllerRef.current.signal };

    setIsLoadingStatus(true);
    try {
      const statusRes = await getMetaStatus(options);
      setMetaStatus(statusRes);

      if (statusRes && statusRes.connected) {
        setIsLoadingAssets(true);
        try {
          const assetsRes = await getMetaAssets(options);
          if (assetsRes && assetsRes.data) {
            setAssets(assetsRes.data);
          } else {
            setAssets(assetsRes);
          }
        } catch (assetErr) {
          if (assetErr.name === "AbortError") return;
          console.error("Failed to fetch Meta assets:", assetErr);
        } finally {
          setIsLoadingAssets(false);
        }
      } else {
        setAssets(null);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Failed to fetch Meta status:", err);
      setMetaStatus({
        connected: false,
        status: "error",
        metaUserId: null,
        grantedScopes: [],
      });
      setAssets(null);
      if (err?.status !== 401) {
        setError(err?.message || "Failed to load Meta integration status.");
      } else {
        setMetaStatus(prev => ({ ...prev, needsReconnect: true }));
        setError("Meta authorization expired or invalid.");
      }
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Handle component mount and OAuth redirect callback parameter inspection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const metaStatusParam = searchParams.get("meta_status");
    const errorParam = searchParams.get("error") || searchParams.get("error_description");

    let isPostOAuth = false;

    if (metaStatusParam === "success") {
      isPostOAuth = true;
      setSuccessMessage("Meta Business Suite connected successfully.");
      setError(null);
    } else if (metaStatusParam === "error" || errorParam) {
      isPostOAuth = true;
      setError(errorParam || "Meta authorization failed or was cancelled.");
    }

    if (isPostOAuth) {
      searchParams.delete("meta_status");
      searchParams.delete("error");
      searchParams.delete("error_description");
      const newSearch = searchParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }

    fetchStatusAndAssets();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatusAndAssets]);

  // Connect flow
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await connectMeta();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("No OAuth authorization URL returned from backend.");
      }
    } catch (err) {
      console.error("Meta connect error:", err);
      setError(err?.message || "Failed to initiate Meta OAuth connection.");
      setIsConnecting(false);
    }
  };

  // Disconnect flow
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    setSuccessMessage(null);
    setShowDisconnectConfirm(false);

    try {
      const res = await disconnectMeta();
      if (res && res.success !== false) {
        setMetaStatus({
          connected: false,
          status: "disconnected",
          metaUserId: null,
          grantedScopes: [],
        });
        setAssets(null);
        setSuccessMessage("Meta integration disconnected.");
      } else {
        throw new Error(res?.message || "Failed to disconnect Meta integration.");
      }
    } catch (err) {
      console.error("Meta disconnect error:", err);
      setError(err?.message || "Failed to disconnect Meta integration.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Selected asset lookup helpers
  const pages = assets?.pages || [];
  const instagramAccounts = assets?.instagramAccounts || [];
  const adAccounts = assets?.adAccounts || [];

  const selectedPage = pages.find((p) => String(p.pageId || p.id) === String(selectedAssets.pageId));
  const selectedInstagram = instagramAccounts.find((ig) => String(ig.instagramAccountId || ig.id) === String(selectedAssets.instagramId));
  const selectedAdAccount = adAccounts.find((ad) => String(ad.adAccountId || ad.id) === String(selectedAssets.adAccountId));

  return (
    <div className="dashboard-card p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Integrations</h3>
        <p className="text-[13px] text-slate-500 mt-1">Connect your tools to pull data directly into Growth OS.</p>
      </div>

      {/* Global Alert Callouts */}
      {error && (
        <div className="mb-6 p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <span>{error}</span>
          <div className="flex items-center gap-3">
            {metaStatus?.needsReconnect && (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="text-red-700 hover:text-red-900 font-bold px-2 py-1 bg-red-100 rounded text-[11px] transition-colors"
              >
                {isConnecting ? "Reconnecting..." : "Reconnect Meta"}
              </button>
            )}
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-sm font-bold leading-none p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-sm">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-sm font-bold leading-none p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const isMeta = integration.id === "int2" || integration.name === "Meta Business Suite";

          if (!isMeta) {
            // Render non-Meta static mock integrations exactly as before
            return (
              <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ${integration.iconColor}`} />
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">{integration.name}</h4>
                    <p className="text-[12.5px] text-slate-500 leading-snug">{integration.description}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors ${
                      integration.status === 'Connected' 
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                        : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {integration.status}
                  </button>
                </div>
              </div>
            );
          }

          // Render live Meta Business Suite integration card
          return (
            <div key={integration.id} className="p-5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col h-full col-span-1 md:col-span-2">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ${integration.iconColor}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">{integration.name}</h4>
                      {isLoadingStatus ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 animate-pulse">
                          Checking...
                        </span>
                      ) : metaStatus?.connected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Connected
                        </span>
                      ) : metaStatus?.needsReconnect ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Auth Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">{integration.description}</p>
                  </div>
                </div>
              </div>

              {/* Asset Discovery & Selection Section (when connected) */}
              {metaStatus?.connected && (
                <div className="my-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-200/60">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Discovered Meta Assets & Asset Selection</span>
                    </span>
                    <button
                      onClick={() => fetchStatusAndAssets()}
                      disabled={isLoadingStatus || isLoadingAssets}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors disabled:opacity-50"
                    >
                      {isLoadingAssets ? "Syncing..." : "↻ Refresh Assets"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Category Summary Card 1: Facebook Pages */}
                    <div
                      onClick={() => pages.length > 0 && setActiveModalCategory("pages")}
                      className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                        pages.length > 0
                          ? "border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                            <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pages ({pages.length})</span>
                          </span>
                          {assets?.capabilities?.pagesAvailable !== false ? (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                          )}
                        </div>

                        {/* Selected Asset Display */}
                        {selectedPage ? (
                          <div className="my-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                Selected
                              </span>
                            </div>
                            <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={selectedPage.name}>
                              {selectedPage.name || `Page ${selectedPage.pageId}`}
                            </p>
                            {selectedPage.category && (
                              <p className="text-[10.5px] text-slate-500 truncate">{selectedPage.category}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic my-2">
                            {pages.length === 0 ? "No Pages discovered" : "No Page selected"}
                          </p>
                        )}
                      </div>

                      {pages.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                          <span>Change selection</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Category Summary Card 2: Instagram Accounts */}
                    <div
                      onClick={() => instagramAccounts.length > 0 && setActiveModalCategory("instagram")}
                      className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                        instagramAccounts.length > 0
                          ? "border-slate-200 hover:border-pink-300 hover:shadow-md cursor-pointer"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                            <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                            <span>Instagram ({instagramAccounts.length})</span>
                          </span>
                          {assets?.capabilities?.instagramAvailable !== false && instagramAccounts.length > 0 ? (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                          )}
                        </div>

                        {/* Selected Asset Display */}
                        {selectedInstagram ? (
                          <div className="my-2 p-2.5 bg-pink-50/60 border border-pink-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-pink-600" />
                                Selected
                              </span>
                            </div>
                            <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={`@${selectedInstagram.username}`}>
                              @{selectedInstagram.username || selectedInstagram.name}
                            </p>
                            {selectedInstagram.followersCount !== undefined && (
                              <p className="text-[10.5px] text-slate-500 font-mono">{selectedInstagram.followersCount.toLocaleString()} followers</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic my-2">
                            {instagramAccounts.length === 0 ? "No IG Accounts discovered" : "No IG Account selected"}
                          </p>
                        )}
                      </div>

                      {instagramAccounts.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-pink-600 group-hover:text-pink-800 transition-colors">
                          <span>Change selection</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* Category Summary Card 3: Ad Accounts */}
                    <div
                      onClick={() => adAccounts.length > 0 && setActiveModalCategory("adAccounts")}
                      className={`p-3.5 bg-white rounded-xl border transition-all flex flex-col justify-between group ${
                        adAccounts.length > 0
                          ? "border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer"
                          : "border-slate-200 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                            <span>Ad Accounts ({adAccounts.length})</span>
                          </span>
                          {assets?.capabilities?.adsAvailable !== false && adAccounts.length > 0 ? (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 rounded">Available</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-amber-50 text-amber-700 rounded">Unavailable</span>
                          )}
                        </div>

                        {/* Selected Asset Display */}
                        {selectedAdAccount ? (
                          <div className="my-2 p-2.5 bg-purple-50/60 border border-purple-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                Selected
                              </span>
                              {selectedAdAccount.currency && (
                                <span className="text-[10px] font-mono font-bold text-purple-600">{selectedAdAccount.currency}</span>
                              )}
                            </div>
                            <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5" title={selectedAdAccount.name}>
                              {selectedAdAccount.name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic my-2">
                            {adAccounts.length === 0 ? "No Ad Accounts discovered" : "No Ad Account selected"}
                          </p>
                        )}
                      </div>

                      {adAccounts.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-purple-600 group-hover:text-purple-800 transition-colors">
                          <span>Change selection</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {metaStatus?.connected && metaStatus?.connectedAt && (
                    <span className="text-[11px] text-slate-400">
                      Connected: {new Date(metaStatus.connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {metaStatus?.connected ? (
                  showDisconnectConfirm ? (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                      <span className="text-[11.5px] font-medium text-red-700">Disconnect?</span>
                      <button
                        onClick={handleConfirmDisconnect}
                        disabled={isDisconnecting}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px] transition-colors disabled:opacity-50"
                      >
                        {isDisconnecting ? "Disconnecting..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setShowDisconnectConfirm(false)}
                        disabled={isDisconnecting}
                        className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 font-semibold rounded text-[11px] border border-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDisconnectConfirm(true)}
                      disabled={isDisconnecting || isLoadingStatus}
                      className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || isLoadingStatus}
                    className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : metaStatus?.needsReconnect ? (
                      "Reconnect Meta"
                    ) : (
                      "Connect Meta"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Selection Modal */}
      {activeModalCategory && (
        <MetaAssetSelectionModal
          isOpen={!!activeModalCategory}
          onClose={() => setActiveModalCategory(null)}
          category={activeModalCategory}
          assets={
            activeModalCategory === "pages"
              ? pages
              : activeModalCategory === "instagram"
              ? instagramAccounts
              : adAccounts
          }
          selectedId={
            activeModalCategory === "pages"
              ? selectedAssets.pageId
              : activeModalCategory === "instagram"
              ? selectedAssets.instagramId
              : selectedAssets.adAccountId
          }
          onSelectAsset={(id) => {
            if (activeModalCategory === "pages") selectPage(id);
            else if (activeModalCategory === "instagram") selectInstagram(id);
            else if (activeModalCategory === "adAccounts") selectAdAccount(id);
          }}
        />
      )}
    </div>
  );
}
