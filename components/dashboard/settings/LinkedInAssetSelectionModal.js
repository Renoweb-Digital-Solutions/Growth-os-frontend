"use client";

import { useState } from "react";
import LinkedInIcon from "@/components/icons/LinkedInIcon";
import { X, Search, CheckCircle2, Megaphone, Building2, ShieldAlert, Users } from "lucide-react";

export default function LinkedInAssetSelectionModal({
  isOpen,
  onClose,
  appType = "ads",
  assets = [],
  selectedId,
  onSelectAsset,
  isSaving = false,
  approvalStatus = "pending_approval",
  apiAccessAvailable = false,
  message,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const isAds = appType === "ads";

  const modalConfig = isAds
    ? {
        title: "Select LinkedIn Ad Account",
        subtitle: "Choose an authorized Ad Account from Growmentum to track advertising campaigns and spend.",
        emptyIcon: Megaphone,
        itemIcon: Megaphone,
        itemTypeLabel: "Ad Account",
        getMetaText: (item) => {
          const parts = [];
          if (item.currency) parts.push(`Currency: ${item.currency}`);
          if (item.status) parts.push(`Status: ${item.status}`);
          parts.push(`ID: ${item.assetId || item.id}`);
          return parts.join(" • ");
        },
      }
    : {
        title: "Select LinkedIn Company Page",
        subtitle: "Choose an authorized Organization Page from Growmentum-community to track page metrics.",
        emptyIcon: Building2,
        itemIcon: Building2,
        itemTypeLabel: "Organization",
        getMetaText: (item) => {
          const parts = [];
          if (item.vanityName) parts.push(`@${item.vanityName}`);
          if (item.role) parts.push(`Role: ${item.role}`);
          parts.push(`ID: ${item.assetId || item.id}`);
          return parts.join(" • ");
        },
      };

  const filteredAssets = assets.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const id = String(item.assetId || item.id || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || id.includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs bg-blue-50 text-[#0077b5] border-blue-100">
                <LinkedInIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-slate-900">{modalConfig.title}</h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                    {assets.length}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{modalConfig.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pending Approval Notice if API access is not yet approved by LinkedIn */}
          {(!apiAccessAvailable || approvalStatus === "pending_approval") && (
            <div className="p-4 mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-2.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">LinkedIn Product Approval Notice</span>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-700">
                  {message ||
                    (isAds
                      ? "LinkedIn Advertising API access is subject to LinkedIn Developer Portal approval. Once approved and authorized with the r_ads scope, ad accounts will appear here automatically."
                      : "LinkedIn Community Management API requires company verification and product approval. Once granted by LinkedIn, company pages will appear here automatically.")}
                </p>
              </div>
            </div>
          )}

          {/* Search bar */}
          {assets.length > 4 && (
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Filter ${modalConfig.itemTypeLabel.toLowerCase()}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Assets List */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13.5px] font-semibold text-slate-700">No assets discovered</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {searchTerm
                    ? "Try searching with a different name or keyword."
                    : !apiAccessAvailable || approvalStatus === "pending_approval"
                    ? "Live asset discovery will activate once LinkedIn product approval is granted."
                    : "No authorized assets found for this LinkedIn account."}
                </p>
              </div>
            ) : (
              filteredAssets.map((item) => {
                const id = String(item.assetId || item.id);
                const name = item.name || `${modalConfig.itemTypeLabel} ${id}`;
                const metaText = modalConfig.getMetaText(item);
                const isSelected = String(id) === String(selectedId);

                return (
                  <div
                    key={id}
                    onClick={() => {
                      if (!isSaving) onSelectAsset(id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-blue-50/50 border-[#0077b5] ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                    } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected ? "bg-[#0077b5] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-[13.5px] font-bold truncate ${isSelected ? "text-blue-950" : "text-slate-800"}`}>
                            {name}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0077b5] text-white rounded-md uppercase tracking-wider">
                              Selected
                            </span>
                          )}
                        </div>
                        {metaText && (
                          <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{metaText}</p>
                        )}
                      </div>
                    </div>

                    {/* Radio/Check indicator */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#0077b5] fill-blue-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-blue-400 transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[12px] text-slate-500 font-medium">
              {isSaving
                ? "Saving selection..."
                : selectedId
                ? "Asset selection saved for your account"
                : "No asset selected"}
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0077b5] text-white text-[12.5px] font-semibold rounded-xl hover:bg-[#006097] transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
