"use client";

import { useState } from "react";
import FacebookIcon from "@/components/icons/FacebookIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { X, Search, CheckCircle2, Megaphone, Users, ShieldCheck } from "lucide-react";

export default function MetaAssetSelectionModal({
  isOpen,
  onClose,
  category,
  assets = [],
  selectedId,
  onSelectAsset,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const getCategoryDetails = () => {
    switch (category) {
      case "pages":
        return {
          title: "Select Facebook Page",
          subtitle: "Choose the Facebook Page to use for social performance and content analytics.",
          icon: FacebookIcon,
          iconBg: "bg-blue-50 text-blue-600 border-blue-100",
          getId: (item) => String(item.pageId || item.id),
          getName: (item) => item.name || `Page ${item.pageId}`,
          getMetaText: (item) => item.category || (item.fanCount !== undefined ? `${item.fanCount.toLocaleString()} followers` : `ID: ${item.pageId}`),
        };
      case "instagram":
        return {
          title: "Select Instagram Account",
          subtitle: "Choose the Instagram Professional account to track profile impressions and media.",
          icon: InstagramIcon,
          iconBg: "bg-pink-50 text-pink-600 border-pink-100",
          getId: (item) => String(item.instagramAccountId || item.id),
          getName: (item) => item.username ? `@${item.username}` : item.name || `Account ${item.instagramAccountId}`,
          getMetaText: (item) => item.followersCount !== undefined ? `${item.followersCount.toLocaleString()} followers` : `ID: ${item.instagramAccountId || item.id}`,
        };
      case "adAccounts":
        return {
          title: "Select Meta Ad Account",
          subtitle: "Choose the advertising account to monitor spend, active campaigns, and ad sets.",
          icon: Megaphone,
          iconBg: "bg-purple-50 text-purple-600 border-purple-100",
          getId: (item) => String(item.adAccountId || item.id),
          getName: (item) => item.name || `Ad Account ${item.adAccountId}`,
          getMetaText: (item) => {
            const currency = item.currency ? item.currency : "";
            const status = item.accountStatus === 1 ? "Active" : "";
            return [currency, status, `ID: ${item.adAccountId || item.accountId}`].filter(Boolean).join(" • ");
          },
        };
      default:
        return {
          title: "Select Meta Asset",
          subtitle: "Choose an asset.",
          icon: ShieldCheck,
          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
          getId: (item) => String(item.id),
          getName: (item) => item.name || "Asset",
          getMetaText: () => "",
        };
    }
  };

  const details = getCategoryDetails();
  const Icon = details.icon;

  const filteredAssets = assets.filter((item) => {
    const name = details.getName(item).toLowerCase();
    const meta = details.getMetaText(item).toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || meta.includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${details.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-slate-900">{details.title}</h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                    {assets.length}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{details.subtitle}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          {assets.length > 4 && (
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Filter ${details.title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* List of Discovered Assets */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13.5px] font-semibold text-slate-700">No matching assets found</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {searchTerm ? "Try searching with a different name or keyword." : "No discovered assets available in this category."}
                </p>
              </div>
            ) : (
              filteredAssets.map((item) => {
                const id = details.getId(item);
                const name = details.getName(item);
                const metaText = details.getMetaText(item);
                const isSelected = String(id) === String(selectedId);

                return (
                  <div
                    key={id}
                    onClick={() => {
                      onSelectAsset(id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        {name.replace(/^@/, "").charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-[13.5px] font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                            {name}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-md uppercase tracking-wider">
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
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-400 transition-colors" />
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
              {selectedId ? "Asset selection saved for your account" : "No asset selected"}
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white text-[12.5px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
