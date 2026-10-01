"use client";

import { useState } from "react";
import { X, Search, CheckCircle2, Globe, ShieldCheck } from "lucide-react";

/**
 * Modal dialog for selecting a verified Google Search Console property (siteUrl)
 */
export default function GooglePropertySelectionModal({
  isOpen,
  onClose,
  properties = [],
  selectedProperty,
  onSelectProperty,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState(selectedProperty);

  if (!isOpen) return null;

  const filteredProperties = properties.filter((item) => {
    const siteUrl = String(item.siteUrl || item.site_url || item).toLowerCase();
    const perm = String(item.permissionLevel || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return siteUrl.includes(query) || perm.includes(query);
  });

  const handleSave = () => {
    if (tempSelected !== selectedProperty) {
      onSelectProperty(tempSelected);
    }
    onClose();
  };

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
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs bg-emerald-50 text-emerald-600 border-emerald-100">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-slate-900">Select Search Console Property</h3>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                    {properties.length}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">
                  Choose the verified website property to track organic search performance.
                </p>
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
          {properties.length > 4 && (
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search property URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* List of Verified Properties */}
          <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13.5px] font-semibold text-slate-700">
                  {properties.length === 0
                    ? "No Google Search Console properties are available for this account."
                    : "No matching properties found"}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {properties.length === 0
                    ? "Ensure your Google account has verified site properties in Search Console."
                    : "Try searching with a different URL string."}
                </p>
              </div>
            ) : (
              filteredProperties.map((item) => {
                const siteUrl = String(item.siteUrl || item.site_url || item);
                const permLevel = item.permissionLevel || item.permission_level || null;
                const isSelected = String(siteUrl) === String(tempSelected);

                return (
                  <div
                    key={siteUrl}
                    onClick={() => setTempSelected(siteUrl)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-[13.5px] font-bold truncate ${isSelected ? "text-emerald-900" : "text-slate-800"}`} title={siteUrl}>
                            {siteUrl}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md uppercase tracking-wider">
                              Selected
                            </span>
                          )}
                        </div>
                        {permLevel && (
                          <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                            Permission: <span className="font-medium text-slate-700">{permLevel}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Radio/Check indicator */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-emerald-400 transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12.5px] font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white text-[12.5px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Save Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
