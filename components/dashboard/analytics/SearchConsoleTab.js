"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import CapabilityState from "@/components/dashboard/analytics/CapabilityState";
import AnalyticsKPICard from "@/components/dashboard/analytics/AnalyticsKPICard";
import {
  Globe,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  FileText,
  MapPin,
  Smartphone,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const METRIC_CONFIGS = {
  clicks: {
    key: "clicks",
    label: "Clicks",
    color: "#10B981",
    formatValue: (val) => (typeof val === "number" && Number.isFinite(val) ? val.toLocaleString("en-US") : "Unavailable"),
    formatYAxis: (val) => (typeof val === "number" && Number.isFinite(val) ? (val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val) : 0),
  },
  impressions: {
    key: "impressions",
    label: "Impressions",
    color: "#3B82F6",
    formatValue: (val) => (typeof val === "number" && Number.isFinite(val) ? val.toLocaleString("en-US") : "Unavailable"),
    formatYAxis: (val) => (typeof val === "number" && Number.isFinite(val) ? (val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val) : 0),
  },
  ctr: {
    key: "ctr",
    label: "CTR",
    color: "#EC4899",
    formatValue: (val) => {
      if (typeof val !== "number" || !Number.isFinite(val)) return "Unavailable";
      const pct = val * 100;
      return `${pct.toFixed(2)}%`;
    },
    formatYAxis: (val) => {
      if (typeof val !== "number" || !Number.isFinite(val)) return "0%";
      const pct = val * 100;
      return `${pct.toFixed(1)}%`;
    },
  },
  position: {
    key: "position",
    label: "Position",
    color: "#8B5CF6",
    formatValue: (val) => (typeof val === "number" && Number.isFinite(val) ? val.toFixed(1) : "Unavailable"),
    formatYAxis: (val) => (typeof val === "number" && Number.isFinite(val) ? val.toFixed(1) : 0),
  },
};

const METRIC_OPTIONS = [
  { key: "clicks", label: "Clicks" },
  { key: "impressions", label: "Impressions" },
  { key: "ctr", label: "CTR" },
  { key: "position", label: "Position" },
];

const CHART_TYPE_OPTIONS = [
  { key: "line", label: "Line" },
  { key: "bar", label: "Bar" },
];

/**
 * Custom tooltip for Multi-Metric & Comparison Performance Trend Chart
 */
function CustomGscTooltip({ active, payload, label, selectedMetrics = ["clicks"], isComparison, currentLabel, comparisonLabel }) {
  if (active && payload && payload.length) {
    const firstItem = payload[0]?.payload;
    if (!firstItem) return null;

    const displayDate = firstItem.dateLabel || label;
    const currDateLabel = firstItem.currentDateLabel;
    const compDateLabel = firstItem.compDateLabel;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-xl min-w-[200px] text-[12px]">
        <div className="pb-2 mb-2 border-b border-slate-100">
          <p className="font-bold text-slate-800">{displayDate}</p>
          {isComparison && currDateLabel && compDateLabel && (
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {currDateLabel} vs {compDateLabel}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {selectedMetrics.map((mKey) => {
            const cfg = METRIC_CONFIGS[mKey];
            if (!cfg) return null;

            if (isComparison) {
              const currVal = firstItem[mKey];
              const compVal = firstItem[`${mKey}_comp`];
              return (
                <div key={mKey} className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                  <div className="pl-4 flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-500">{currentLabel || "Current"}:</span>
                    <span className="font-semibold text-slate-800 font-mono">{cfg.formatValue(currVal)}</span>
                  </div>
                  <div className="pl-4 flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-400">{comparisonLabel || "Comparison"}:</span>
                    <span className="font-semibold text-slate-500 font-mono">{cfg.formatValue(compVal)}</span>
                  </div>
                </div>
              );
            } else {
              const rawVal = firstItem[mKey];
              return (
                <div key={mKey} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    {cfg.label}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {cfg.formatValue(rawVal)}
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Local helper functions for formatting GSC overview & table metrics safely.
 * Strictly preserves 0 as "0" and converts null/undefined/NaN to "Unavailable".
 */
function formatClicks(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return num.toLocaleString("en-US");
}

function formatImpressions(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return num.toLocaleString("en-US");
}

function formatCtr(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  // GSC CTR is returned as a decimal from backend API (e.g., 0.0425). Multiply by 100 for display (4.25%).
  const pct = num * 100;
  return `${pct.toFixed(2)}%`;
}

function formatPosition(val) {
  if (val === null || val === undefined || val === "") return "Unavailable";
  const num = Number(val);
  if (!Number.isFinite(num)) return "Unavailable";
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
}

const DEVICE_LABEL_MAP = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet",
};

function formatDeviceLabel(val) {
  if (val === null || val === undefined || val === "") return "Unknown Device";
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (DEVICE_LABEL_MAP[upper]) return DEVICE_LABEL_MAP[upper];
  return str;
}

const ALPHA3_TO_ALPHA2 = {
  AFG: "AF", ALB: "AL", DZA: "DZ", ASM: "AS", AND: "AD", AGO: "AO", AIA: "AI", ATA: "AQ",
  ATG: "AG", ARG: "AR", ARM: "AM", ABW: "AW", AUS: "AU", AUT: "AT", AZE: "AZ", BHS: "BS",
  BHR: "BH", BGD: "BD", BRB: "BB", BLR: "BY", BEL: "BE", BLZ: "BZ", BEN: "BJ", BMU: "BM",
  BTN: "BT", BOL: "BO", BES: "BQ", BIH: "BA", BWA: "BW", BVT: "BV", BRA: "BR", IOT: "IO",
  BRN: "BN", BGR: "BG", BFA: "BF", BDI: "BI", CPV: "CV", KHM: "KH", CMR: "CM", CAN: "CA",
  CYM: "KY", CAF: "CF", TCD: "TD", CHL: "CL", CHN: "CN", CXR: "CX", CCK: "CC", COL: "CO",
  COM: "KM", COG: "CG", COD: "CD", COK: "CK", CRI: "CR", CIV: "CI", HRV: "HR", CUB: "CU",
  CUW: "CW", CYP: "CY", CZE: "CZ", DNK: "DK", DJB: "DJ", DMA: "DM", DOM: "DO", ECU: "EC",
  EGY: "EG", SLV: "SV", GNQ: "GQ", ERI: "ER", EST: "EE", SWZ: "SZ", ETH: "ET", FLK: "FK",
  FRO: "FO", FJI: "FJ", FIN: "FI", FRA: "FR", GUF: "GF", PYF: "PF", ATF: "TF", GAB: "GA",
  GMB: "GM", GEO: "GE", DEU: "DE", GHA: "GH", GIB: "GI", GRC: "GR", GRL: "GL", GRD: "GD",
  GLP: "GP", GUM: "GU", GTM: "GT", GGY: "GG", GIN: "GN", GNB: "GW", GUY: "GY", HTI: "HT",
  HMD: "HM", VAT: "VA", HND: "HN", HKG: "HK", HUN: "HU", ISL: "IS", IND: "IN", IDN: "ID",
  IRN: "IR", IRQ: "IQ", IRL: "IE", IMN: "IM", ISR: "IL", ITA: "IT", JAM: "JM", JPN: "JP",
  JEY: "JE", JOR: "JO", KAZ: "KZ", KEN: "KE", KIR: "KI", PRK: "KP", KOR: "KR", KWT: "KW",
  KGZ: "KG", LAO: "LA", LVA: "LV", LBN: "LB", LSO: "LS", LBR: "LR", LBY: "LY", LIE: "LI",
  LTU: "LT", LUX: "LU", MAC: "MO", MKD: "MK", MDG: "MG", MWI: "MW", MYS: "MY", MDV: "MV",
  MLI: "ML", MLT: "MT", MHL: "MH", MTQ: "MQ", MRT: "MR", MUS: "MU", MYT: "YT", MEX: "MX",
  FSM: "FM", MDA: "MD", MCO: "MC", MNG: "MN", MNE: "ME", MSR: "MS", MAR: "MA", MOZ: "MZ",
  MMR: "MM", NAM: "NA", NRU: "NR", NPL: "NP", NLD: "NL", NCL: "NC", NZL: "NZ", NIC: "NI",
  NER: "NE", NGA: "NG", NIU: "NU", NFK: "NF", MNP: "MP", NOR: "NO", OMN: "OM", PAK: "PK",
  PLW: "PW", PSE: "PS", PAN: "PA", PNG: "PG", PRY: "PY", PER: "PE", PHL: "PH", PCN: "PN",
  POL: "PL", PRT: "PT", PRI: "PR", QAT: "QA", REU: "RE", ROU: "RO", RUS: "RU", RWA: "RW",
  BLM: "BL", SHN: "SH", KNA: "KN", LCA: "LC", MAF: "MF", SPM: "PM", VCT: "VC", WSM: "WS",
  SMR: "SM", STP: "ST", SAU: "SA", SEN: "SN", SRB: "RS", SYC: "SC", SLE: "SL", SGP: "SG",
  SXM: "SX", SVK: "SK", SVN: "SI", SLB: "SB", SOM: "SO", ZAF: "ZA", SGS: "GS", SSD: "SS",
  ESP: "ES", LKA: "LK", SDN: "SD", SUR: "SR", SJM: "SJ", SWE: "SE", CHE: "CH", SYR: "SY",
  TWN: "TW", TJK: "TJ", TZA: "TZ", THA: "TH", TLS: "TL", TGO: "TG", TKL: "TK", TON: "TO",
  TTO: "TT", TUN: "TN", TUR: "TR", TKM: "TM", TCA: "TC", TUV: "TV", UGA: "UG", UKR: "UA",
  ARE: "AE", GBR: "GB", USA: "US", UMI: "UM", URY: "UY", UZB: "UZ", VUT: "VU", VEN: "VE",
  VNM: "VN", VGB: "VG", VIR: "VI", WLF: "WF", ESH: "EH", YEM: "YE", ZMB: "ZM", ZWE: "ZW",
};

let regionDisplayNames = null;

function getRegionDisplayNames() {
  if (!regionDisplayNames && typeof Intl !== "undefined" && Intl.DisplayNames) {
    try {
      regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch (e) {
      regionDisplayNames = null;
    }
  }
  return regionDisplayNames;
}

function formatCountryLabel(val) {
  if (val === null || val === undefined || val === "") return "Unknown Country";
  const strVal = String(val).trim();
  if (!strVal) return "Unknown Country";

  const upperKey = strVal.toUpperCase();
  let regionCode = null;

  if (ALPHA3_TO_ALPHA2[upperKey]) {
    regionCode = ALPHA3_TO_ALPHA2[upperKey];
  } else if (upperKey.length === 2 && /^[A-Z]{2}$/.test(upperKey)) {
    regionCode = upperKey;
  }

  if (regionCode) {
    try {
      const formatter = getRegionDisplayNames();
      if (formatter) {
        const name = formatter.of(regionCode);
        if (name && name !== regionCode) {
          return name;
        }
      }
    } catch (e) {
      // Ignore formatting error and fall back
    }
  }

  return strVal;
}

const BREAKDOWN_METRIC_LABELS = {
  clicks: "Clicks",
  impressions: "Impressions",
  ctr: "CTR",
  position: "Position",
};

/**
 * Render cell value for metric Current column in comparison mode
 */
function renderMetricCurrentCell(item, metric) {
  if (metric === "clicks") return item.clicks.toLocaleString("en-US");
  if (metric === "impressions") return item.impressions.toLocaleString("en-US");
  if (metric === "ctr") return `${(item.ctrRaw * 100).toFixed(2)}%`;
  if (metric === "position") return item.positionRaw > 0 ? item.positionRaw.toFixed(2) : "0.00";
  return "0";
}

/**
 * Render cell value for metric Previous column in comparison mode
 */
function renderMetricPreviousCell(item, metric) {
  if (metric === "clicks") return item.clicksComp.toLocaleString("en-US");
  if (metric === "impressions") return item.impressionsComp.toLocaleString("en-US");
  if (metric === "ctr") return `${(item.ctrCompRaw * 100).toFixed(2)}%`;
  if (metric === "position") return item.positionCompRaw > 0 ? item.positionCompRaw.toFixed(2) : "0.00";
  return "0";
}

/**
 * Render cell value for metric Difference column in comparison mode
 */
function renderMetricDifferenceCell(item, metric) {
  if (metric === "clicks" || metric === "impressions") {
    const diff = metric === "clicks" ? item.clicksDiff : item.impressionsDiff;
    if (diff > 0) return <span className="text-emerald-600 font-semibold font-mono">+{diff.toLocaleString("en-US")}</span>;
    if (diff < 0) return <span className="text-red-600 font-semibold font-mono">{diff.toLocaleString("en-US")}</span>;
    return <span className="text-slate-400 font-semibold font-mono">0</span>;
  }
  if (metric === "ctr") {
    const diff = item.ctrDiffPctPoints;
    if (diff > 0) return <span className="text-emerald-600 font-semibold font-mono">+{diff.toFixed(2)} pp</span>;
    if (diff < 0) return <span className="text-red-600 font-semibold font-mono">{diff.toFixed(2)} pp</span>;
    return <span className="text-slate-400 font-semibold font-mono">0.00 pp</span>;
  }
  if (metric === "position") {
    const diff = item.positionDiff;
    if (diff > 0) return <span className="text-emerald-600 font-semibold font-mono">+{diff.toFixed(2)}</span>;
    if (diff < 0) return <span className="text-red-600 font-semibold font-mono">{diff.toFixed(2)}</span>;
    return <span className="text-slate-400 font-semibold font-mono">0.00</span>;
  }
  return null;
}

/**
 * Compact Breakdown Table Metric Selector Dropdown
 */
function TableMetricSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const options = [
    { key: "clicks", label: "Clicks" },
    { key: "impressions", label: "Impressions" },
    { key: "ctr", label: "CTR" },
    { key: "position", label: "Position" },
  ];

  const currentLabel = BREAKDOWN_METRIC_LABELS[value] || "Impressions";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-label="Select breakdown comparison metric"
      >
        <span className="text-slate-400 font-normal text-[11px]">Metric:</span>
        <span>{currentLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white border border-slate-200 rounded-xl p-1 shadow-lg text-[12.5px] animate-in fade-in slide-in-from-top-1 duration-100">
          {options.map((opt) => {
            const isSelected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onChange(opt.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
                  isSelected
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Merges current and comparison breakdown items by unique key (UNION of keys).
 * Current period items appear first in original order, followed by comparison-only items.
 */
function mergeBreakdownItems(currentItemsRaw = [], compItemsRaw = [], keyExtractor, labelExtractor) {
  const currentItems = Array.isArray(currentItemsRaw) ? currentItemsRaw : (Array.isArray(currentItemsRaw?.items) ? currentItemsRaw.items : []);
  const compItems = Array.isArray(compItemsRaw) ? compItemsRaw : (Array.isArray(compItemsRaw?.items) ? compItemsRaw.items : []);

  const map = new Map();

  currentItems.forEach((item) => {
    const rawKey = keyExtractor(item);
    if (!rawKey) return;
    map.set(String(rawKey), {
      key: String(rawKey),
      label: labelExtractor(item),
      curr: item,
      comp: null,
    });
  });

  compItems.forEach((item) => {
    const rawKey = keyExtractor(item);
    if (!rawKey) return;
    const strKey = String(rawKey);
    if (map.has(strKey)) {
      map.get(strKey).comp = item;
    } else {
      map.set(strKey, {
        key: strKey,
        label: labelExtractor(item),
        curr: null,
        comp: item,
      });
    }
  });

  return Array.from(map.values()).map((entry) => {
    const clicksCurr = Number(entry.curr?.clicks);
    const clicksComp = Number(entry.comp?.clicks);
    const impressionsCurr = Number(entry.curr?.impressions);
    const impressionsComp = Number(entry.comp?.impressions);
    const ctrCurr = Number(entry.curr?.ctr);
    const ctrComp = Number(entry.comp?.ctr);
    const positionCurr = Number(entry.curr?.position);
    const positionComp = Number(entry.comp?.position);

    const clicksVal = Number.isFinite(clicksCurr) ? Math.max(0, clicksCurr) : 0;
    const clicksCompVal = Number.isFinite(clicksComp) ? Math.max(0, clicksComp) : 0;

    const impressionsVal = Number.isFinite(impressionsCurr) ? Math.max(0, impressionsCurr) : 0;
    const impressionsCompVal = Number.isFinite(impressionsComp) ? Math.max(0, impressionsComp) : 0;

    const ctrVal = Number.isFinite(ctrCurr) ? Math.max(0, ctrCurr) : 0;
    const ctrCompVal = Number.isFinite(ctrComp) ? Math.max(0, ctrComp) : 0;

    const positionVal = Number.isFinite(positionCurr) ? Math.max(0, positionCurr) : 0;
    const positionCompVal = Number.isFinite(positionComp) ? Math.max(0, positionComp) : 0;

    return {
      id: entry.key,
      key: entry.key,
      label: entry.label,
      query: entry.label,
      pageUrl: entry.label,
      country: entry.label,
      device: entry.label,
      clicks: clicksVal,
      clicksComp: clicksCompVal,
      clicksDiff: clicksVal - clicksCompVal,
      impressions: impressionsVal,
      impressionsComp: impressionsCompVal,
      impressionsDiff: impressionsVal - impressionsCompVal,
      ctrRaw: ctrVal,
      ctrCompRaw: ctrCompVal,
      ctrDiffPctPoints: (ctrVal * 100) - (ctrCompVal * 100),
      positionRaw: positionVal,
      positionCompRaw: positionCompVal,
      positionDiff: positionVal - positionCompVal,
      ctr: formatCtr(entry.curr?.ctr),
      position: formatPosition(entry.curr?.position),
      formattedClicks: formatClicks(entry.curr?.clicks),
      formattedImpressions: formatImpressions(entry.curr?.impressions),
    };
  });
}

/**
 * Safely extracts aggregate KPI metric value from overviewData (preferring top-level data, falling back to summary or wrapped data)
 */
function getOverviewMetric(overviewData, key) {
  if (!overviewData) return undefined;
  if (overviewData[key] !== undefined && overviewData[key] !== null) return overviewData[key];
  if (overviewData.summary && overviewData.summary[key] !== undefined && overviewData.summary[key] !== null) return overviewData.summary[key];
  if (overviewData.data && overviewData.data[key] !== undefined && overviewData.data[key] !== null) return overviewData.data[key];
  if (overviewData.data?.summary && overviewData.data.summary[key] !== undefined && overviewData.data.summary[key] !== null) return overviewData.data.summary[key];
  return undefined;
}

/**
 * Calculates display row limit safely for frontend table slice
 */
function getEffectiveLimit(mode, customVal, totalLen) {
  if (mode === "all") return totalLen;
  if (mode === "custom") {
    return typeof customVal === "number" && customVal > 0 ? customVal : totalLen;
  }
  return typeof mode === "number" ? mode : 10;
}

/**
 * Compact Row Count Selector Dropdown & Custom Input Modal
 */
function RowCountSelector({ value, customValue, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState(customValue ? String(customValue) : "25");
  const [errorMsg, setErrorMsg] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const displayLabel = value === "all" ? "All" : value === "custom" ? `Custom (${customValue || ""})` : String(value);

  const handleSelect = (opt) => {
    if (opt === "custom") {
      setIsOpen(false);
      setInputVal(customValue ? String(customValue) : "25");
      setErrorMsg("");
      setIsCustomModalOpen(true);
    } else {
      onChange(opt, null);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid positive integer.");
      return;
    }
    const num = parseInt(trimmed, 10);
    if (num <= 0) {
      setErrorMsg("Number of rows must be greater than 0.");
      return;
    }
    setErrorMsg("");
    onChange("custom", num);
    setIsCustomModalOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 transition-colors shadow-2xs"
      >
        <span className="text-slate-400 font-normal text-[11px]">Rows:</span>
        <span>{displayLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white border border-slate-200 rounded-xl p-1 shadow-lg text-[12.5px]">
          {[10, 50, 100, "all", "custom"].map((opt) => {
            const isSelected = value === opt;
            const label = opt === "all" ? "All" : opt === "custom" ? "Custom..." : String(opt);
            return (
              <button
                key={String(opt)}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-left ${
                  isSelected
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span>{label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}

      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-xs w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-[14px] font-bold text-slate-800 mb-1">Custom Row Count</h4>
            <p className="text-[12px] text-slate-500 mb-4">Enter the maximum number of rows to display in this table.</p>
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="e.g. 25"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  autoFocus
                />
                {errorMsg && <p className="text-[11.5px] font-medium text-red-600 mt-1.5">{errorMsg}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[12.5px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Phase 4E — Google Search Console Analytics Tab
 * Visual & Chart UI Improvements for Performance Trend Chart & Breakdown Tables
 */
export default function SearchConsoleTab({
  isConnected,
  properties = [],
  selectedProperty,
  setSelectedProperty,
  analyticsData,
  datasetErrors,
  isLoadingAnalytics,
  isLoading,
  error,
  refresh,
  comparisonEnabled = false,
  comparisonType = "previous_period",
  granularity = "date",
  rangeLabel = "",
  currentLabel = "",
  comparisonLabel = "",
}) {
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [selectedMetrics, setSelectedMetrics] = useState(["clicks"]);

  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  // Independent Metric Selector states for each breakdown table
  const [queryMetric, setQueryMetric] = useState("impressions");
  const [pagesMetric, setPagesMetric] = useState("impressions");
  const [countriesMetric, setCountriesMetric] = useState("impressions");
  const [devicesMetric, setDevicesMetric] = useState("impressions");

  // Independent Row Count states for each breakdown table
  const [queryRowCount, setQueryRowCount] = useState(10);
  const [queryCustomVal, setQueryCustomVal] = useState(null);

  const [pagesRowCount, setPagesRowCount] = useState(10);
  const [pagesCustomVal, setPagesCustomVal] = useState(null);

  const [countriesRowCount, setCountriesRowCount] = useState(10);
  const [countriesCustomVal, setCountriesCustomVal] = useState(null);

  const [devicesRowCount, setDevicesRowCount] = useState(10);
  const [devicesCustomVal, setDevicesCustomVal] = useState(null);

  const chartTypeDropdownRef = useRef(null);
  const metricDropdownRef = useRef(null);

  const handleToggleMetric = (key) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least one metric selected
        return prev.filter((m) => m !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (chartTypeDropdownRef.current && !chartTypeDropdownRef.current.contains(event.target)) {
        setIsChartTypeDropdownOpen(false);
      }
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(event.target)) {
        setIsMetricDropdownOpen(false);
      }
    }
    if (isChartTypeDropdownOpen || isMetricDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChartTypeDropdownOpen, isMetricDropdownOpen]);

  // Extract raw trend series for standard non-comparison view
  const rawTrendData = useMemo(() => {
    if (Array.isArray(analyticsData?.overview?.trend) && analyticsData.overview.trend.length > 0) {
      return analyticsData.overview.trend;
    }
    if (Array.isArray(analyticsData?.performance?.items) && analyticsData.performance.items.length > 0) {
      return analyticsData.performance.items;
    }
    return [];
  }, [analyticsData]);

  // Pure transformation into sorted Recharts time-series data
  const chartData = useMemo(() => {
    const isComparison = comparisonEnabled && !!analyticsData?.comparison;

    if (isComparison && analyticsData?.comparison) {
      const compObj = analyticsData.comparison;
      const currentTrend = compObj.current?.rows || compObj.current?.trend || compObj.currentPeriod?.rows || compObj.currentPeriod?.trend || [];
      const compTrend = compObj.comparison?.rows || compObj.comparison?.trend || compObj.comparisonPeriod?.rows || compObj.comparisonPeriod?.trend || [];
      const maxLen = Math.max(currentTrend.length, compTrend.length);
      if (maxLen === 0) return [];

      const items = [];
      for (let i = 0; i < maxLen; i++) {
        const curr = currentTrend[i];
        const comp = compTrend[i];

        const currRawDate = String(curr?.date || curr?.keys?.[0] || (curr?.hour !== undefined ? curr.hour : ""));
        const compRawDate = String(comp?.date || comp?.keys?.[0] || (comp?.hour !== undefined ? comp.hour : ""));

        let dateLabel = currRawDate;
        let currentDateLabel = currRawDate;
        let compDateLabel = compRawDate;

        if (granularity === "hour") {
          const hourVal = curr?.hour !== undefined ? curr.hour : (comp?.hour !== undefined ? comp.hour : (currRawDate || String(i).padStart(2, "0")));
          dateLabel = `${String(hourVal).padStart(2, "0")}:00`;
          currentDateLabel = curr?.date ? `${curr.date} (${dateLabel})` : `Hour ${dateLabel}`;
          compDateLabel = comp?.date ? `${comp.date} (${dateLabel})` : `Hour ${dateLabel}`;
        } else {
          if (currRawDate && currRawDate.includes("-")) {
            const parts = currRawDate.split("-");
            if (parts.length === 3) {
              const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              if (!isNaN(dateObj.getTime())) {
                dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                currentDateLabel = dateLabel;
              }
            }
          }
          if (compRawDate && compRawDate.includes("-")) {
            const parts = compRawDate.split("-");
            if (parts.length === 3) {
              const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              if (!isNaN(dateObj.getTime())) {
                compDateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }
            }
          }
        }

        const parseNum = (val) => {
          const n = Number(val);
          return Number.isFinite(n) ? Math.max(0, n) : 0;
        };

        items.push({
          index: i,
          dateLabel,
          currentDateLabel,
          compDateLabel,
          clicks: parseNum(curr?.clicks),
          impressions: parseNum(curr?.impressions),
          ctr: parseNum(curr?.ctr),
          position: parseNum(curr?.position),
          clicks_comp: parseNum(comp?.clicks),
          impressions_comp: parseNum(comp?.impressions),
          ctr_comp: parseNum(comp?.ctr),
          position_comp: parseNum(comp?.position),
        });
      }

      return items.map((d, i) => ({
        ...d,
        label: i % Math.max(1, Math.floor(items.length / 5)) === 0 ? d.dateLabel : "",
      }));
    }

    if (!rawTrendData || rawTrendData.length === 0) return [];

    const mapped = rawTrendData
      .map((item) => {
        const rawDate = String(item.date || item.keys?.[0] || "");
        let dateLabel = rawDate;
        if (rawDate && rawDate.includes("-")) {
          const parts = rawDate.split("-");
          if (parts.length === 3) {
            const year = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            const day = Number(parts[2]);
            const dateObj = new Date(year, month, day);
            if (!isNaN(dateObj.getTime())) {
              dateLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
          }
        }

        const clicks = Number(item.clicks);
        const impressions = Number(item.impressions);
        const ctr = Number(item.ctr);
        const position = Number(item.position);

        return {
          rawDate,
          dateLabel,
          clicks: Number.isFinite(clicks) ? Math.max(0, clicks) : 0,
          impressions: Number.isFinite(impressions) ? Math.max(0, impressions) : 0,
          ctr: Number.isFinite(ctr) ? Math.max(0, ctr) : 0,
          position: Number.isFinite(position) ? Math.max(0, position) : 0,
        };
      })
      .filter((item) => Boolean(item.rawDate));

    const sorted = mapped.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    return sorted.map((d, i) => ({
      ...d,
      label: i % Math.max(1, Math.floor(sorted.length / 5)) === 0 ? d.dateLabel : "",
    }));
  }, [rawTrendData, comparisonEnabled, analyticsData, granularity]);

  // Transform Search Queries Dataset safely (merging current & comparison period rows)
  const queryItems = useMemo(() => {
    const currentRaw = analyticsData?.queries?.items || analyticsData?.queries || [];
    const compRaw = analyticsData?.comparisonQueries?.items || analyticsData?.comparisonQueries || [];
    return mergeBreakdownItems(
      currentRaw,
      compRaw,
      (item) => item.keys?.[0] || item.query || item.id,
      (item) => item.keys?.[0] || item.query || item.id || "Unknown Query"
    );
  }, [analyticsData]);

  const displayedQueryItems = useMemo(() => {
    const limit = getEffectiveLimit(queryRowCount, queryCustomVal, queryItems.length);
    return queryItems.slice(0, limit);
  }, [queryItems, queryRowCount, queryCustomVal]);

  // Transform Landing Pages Dataset safely (merging current & comparison period rows)
  const pageItems = useMemo(() => {
    const currentRaw = analyticsData?.pages?.items || analyticsData?.pages || [];
    const compRaw = analyticsData?.comparisonPages?.items || analyticsData?.comparisonPages || [];
    return mergeBreakdownItems(
      currentRaw,
      compRaw,
      (item) => item.keys?.[0] || item.page || item.id,
      (item) => item.keys?.[0] || item.page || item.id || "Unknown Page"
    );
  }, [analyticsData]);

  const displayedPageItems = useMemo(() => {
    const limit = getEffectiveLimit(pagesRowCount, pagesCustomVal, pageItems.length);
    return pageItems.slice(0, limit);
  }, [pageItems, pagesRowCount, pagesCustomVal]);

  // Transform Country Breakdown Dataset safely (merging current & comparison period rows)
  const countryItems = useMemo(() => {
    const currentRaw = analyticsData?.countries?.items || analyticsData?.countries || [];
    const compRaw = analyticsData?.comparisonCountries?.items || analyticsData?.comparisonCountries || [];
    return mergeBreakdownItems(
      currentRaw,
      compRaw,
      (item) => item.keys?.[0] || item.country || item.id,
      (item) => formatCountryLabel(item.keys?.[0] || item.country || item.id)
    );
  }, [analyticsData]);

  const displayedCountryItems = useMemo(() => {
    const limit = getEffectiveLimit(countriesRowCount, countriesCustomVal, countryItems.length);
    return countryItems.slice(0, limit);
  }, [countryItems, countriesRowCount, countriesCustomVal]);

  // Transform Device Breakdown Dataset safely (merging current & comparison period rows)
  const deviceItems = useMemo(() => {
    const currentRaw = analyticsData?.devices?.items || analyticsData?.devices || [];
    const compRaw = analyticsData?.comparisonDevices?.items || analyticsData?.comparisonDevices || [];
    return mergeBreakdownItems(
      currentRaw,
      compRaw,
      (item) => item.keys?.[0] || item.device || item.id,
      (item) => formatDeviceLabel(item.keys?.[0] || item.device || item.id)
    );
  }, [analyticsData]);

  const displayedDeviceItems = useMemo(() => {
    const limit = getEffectiveLimit(devicesRowCount, devicesCustomVal, deviceItems.length);
    return deviceItems.slice(0, limit);
  }, [deviceItems, devicesRowCount, devicesCustomVal]);

  // 1. Loading state (Initial GSC connection status or properties check in progress)
  if (isLoading && !isConnected && properties.length === 0) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl animate-pulse">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[14px] font-semibold text-slate-700">Loading Search Console status...</p>
      </div>
    );
  }

  // 2. Global Error state
  if (error && !isConnected) {
    return (
      <div className="dashboard-card p-8 flex flex-col items-center justify-center text-center my-6 bg-red-50/40 border border-red-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1">Failed to load Search Console integration</h3>
        <p className="text-[13px] text-red-600 max-w-md mb-5">{error}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // 3. State A — Not connected
  if (isConnected === false) {
    return (
      <CapabilityState
        title="Google Search Console Disconnected"
        description="Connect Google Search Console from Settings to view Search Console analytics."
        actionText="Manage Integration Settings"
        actionHref="/dashboard/settings?tab=integrations"
      />
    );
  }

  // 4. State B — Connected but zero properties available
  if (isConnected === true && properties.length === 0) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">No Verified Properties Available</h3>
        <p className="text-[13.5px] text-slate-500 max-w-md mb-6 leading-relaxed">
          No Google Search Console properties are available for this account.
        </p>
        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <span>Check Integration Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // 5. State C — Connected + properties exist but no selected property
  if (isConnected === true && properties.length > 0 && !selectedProperty) {
    return (
      <div className="dashboard-card p-10 flex flex-col items-center justify-center text-center my-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
          <Globe className="w-6 h-6" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">Select a Search Console Property</h3>
        <p className="text-[13.5px] text-slate-500 max-w-md mb-6 leading-relaxed">
          Select a Google Search Console property to view analytics.
        </p>
        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <span>Select Property in Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Extract overview dataset and errors
  const overviewData = analyticsData?.overview;
  const isComparison = comparisonEnabled && !!analyticsData?.comparison;
  const compData = analyticsData?.comparison;
  const currentSummary = isComparison ? (compData?.current?.summary || compData?.currentPeriod?.summary) : null;
  const comparisonSummary = isComparison ? (compData?.comparison?.summary || compData?.comparisonPeriod?.summary) : null;

  const hasOverviewError = !!datasetErrors?.overview;
  const hasComparisonError = isComparison && !!datasetErrors?.comparison;
  const hasQueriesError = !!datasetErrors?.queries;
  const hasPagesError = !!datasetErrors?.pages;
  const hasCountriesError = !!datasetErrors?.countries;
  const hasDevicesError = !!datasetErrors?.devices;

  const kpis = [
    {
      label: "Total Clicks",
      isComparison,
      value: hasOverviewError ? "Unavailable" : formatClicks(getOverviewMetric(overviewData, "clicks")),
      currentValue: formatClicks(isComparison ? (currentSummary?.clicks ?? getOverviewMetric(overviewData, "clicks")) : getOverviewMetric(overviewData, "clicks")),
      comparisonValue: formatClicks(comparisonSummary?.clicks),
      currentLabel: currentLabel || "Current period",
      comparisonLabel: comparisonLabel || "Comparison period",
      color: "#10B981",
    },
    {
      label: "Total Impressions",
      isComparison,
      value: hasOverviewError ? "Unavailable" : formatImpressions(getOverviewMetric(overviewData, "impressions")),
      currentValue: formatImpressions(isComparison ? (currentSummary?.impressions ?? getOverviewMetric(overviewData, "impressions")) : getOverviewMetric(overviewData, "impressions")),
      comparisonValue: formatImpressions(comparisonSummary?.impressions),
      currentLabel: currentLabel || "Current period",
      comparisonLabel: comparisonLabel || "Comparison period",
      color: "#3B82F6",
    },
    {
      label: "Average CTR",
      isComparison,
      value: hasOverviewError ? "Unavailable" : formatCtr(getOverviewMetric(overviewData, "ctr")),
      currentValue: formatCtr(isComparison ? (currentSummary?.ctr ?? getOverviewMetric(overviewData, "ctr")) : getOverviewMetric(overviewData, "ctr")),
      comparisonValue: formatCtr(comparisonSummary?.ctr),
      currentLabel: currentLabel || "Current period",
      comparisonLabel: comparisonLabel || "Comparison period",
      color: "#EC4899",
    },
    {
      label: "Average Position",
      isComparison,
      value: hasOverviewError ? "Unavailable" : formatPosition(getOverviewMetric(overviewData, "position")),
      currentValue: formatPosition(isComparison ? (currentSummary?.position ?? getOverviewMetric(overviewData, "position")) : getOverviewMetric(overviewData, "position")),
      comparisonValue: formatPosition(comparisonSummary?.position),
      currentLabel: currentLabel || "Current period",
      comparisonLabel: comparisonLabel || "Comparison period",
      color: "#8B5CF6",
    },
  ];

  const hasCountMetrics = selectedMetrics.some((m) => m === "clicks" || m === "impressions");
  const hasRightAxisMetrics = selectedMetrics.some((m) => m === "ctr" || m === "position");

  // 6. State D — Connected + selected property
  return (
    <div className="space-y-6">
      {/* Active Property Status Header Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900">Google Search Console Analytics</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Connected
              </span>
              {isComparison && (
                <span className="px-2.5 py-0.5 text-[10.5px] font-bold bg-indigo-100 text-indigo-800 rounded-full">
                  {rangeLabel || "Comparison Mode"}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-slate-500 truncate max-w-md" title={selectedProperty}>
              Active Property: <span className="font-semibold text-slate-800">{selectedProperty}</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/settings?tab=integrations"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>Change Property</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Overview Dataset Error Callout */}
      {hasOverviewError && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>Failed to load Overview metrics: {datasetErrors.overview}</span>
        </div>
      )}

      {/* 4 Overview KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <AnalyticsKPICard
            key={kpi.label}
            kpi={kpi}
            loading={isLoadingAnalytics}
          />
        ))}
      </div>

      {/* Organic Search Performance Trend Chart Card */}
      <div className="dashboard-card p-6 relative min-h-[400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Organic Search Performance</h3>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              {isComparison && rangeLabel ? rangeLabel : "Metrics over time for selected property"}
            </p>
          </div>

          {/* Independent Controls: Chart Type & Multi-Metric Selector Dropdowns */}
          {!isLoadingAnalytics && chartData.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Chart Type Dropdown (Line / Bar ONLY) */}
              <div className="relative" ref={chartTypeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsChartTypeDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  aria-expanded={isChartTypeDropdownOpen}
                >
                  <span className="text-slate-400 font-normal text-[11.5px]">Type:</span>
                  <span>{CHART_TYPE_OPTIONS.find((t) => t.key === selectedChartType)?.label || "Line"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isChartTypeDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white border border-slate-200 rounded-xl p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                    {CHART_TYPE_OPTIONS.map((opt) => {
                      const isSelected = opt.key === selectedChartType;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSelectedChartType(opt.key);
                            setIsChartTypeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] font-medium rounded-lg transition-colors ${
                            isSelected
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Multi-Metric Selector Dropdown */}
              <div className="relative" ref={metricDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMetricDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  aria-expanded={isMetricDropdownOpen}
                >
                  <div className="flex items-center gap-1">
                    {selectedMetrics.map((mKey) => (
                      <span
                        key={mKey}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: METRIC_CONFIGS[mKey]?.color }}
                      />
                    ))}
                  </div>
                  <span>
                    {selectedMetrics.length === 1
                      ? METRIC_CONFIGS[selectedMetrics[0]]?.label
                      : `${selectedMetrics.length} Metrics`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isMetricDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Select Metrics
                    </div>
                    {METRIC_OPTIONS.map((opt) => {
                      const isChecked = selectedMetrics.includes(opt.key);
                      const cfg = METRIC_CONFIGS[opt.key];
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleToggleMetric(opt.key)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-lg transition-colors text-left ${
                            isChecked
                              ? "bg-slate-50 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                            <span>{opt.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isLoadingAnalytics ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs z-10 rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
              <span className="text-[12.5px] font-semibold text-slate-500">Loading growth trends...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
            <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl max-w-md">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                {datasetErrors?.overview || datasetErrors?.performance || datasetErrors?.comparison
                  ? "Failed to load performance trend data"
                  : "No Search Console performance data is available for this period."}
              </h4>
              <p className="text-[12.5px] text-slate-500">
                {datasetErrors?.overview || datasetErrors?.performance || datasetErrors?.comparison
                  ? datasetErrors.overview || datasetErrors.performance || datasetErrors.comparison
                  : "No trend data was returned for the selected time period."}
              </p>
            </div>
          </div>
        ) : null}

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === "bar" ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  interval={0}
                  tickFormatter={(v, i) => chartData[i]?.label || ""}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={(val) => (typeof val === "number" && val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val)}
                  dx={-10}
                />
                {hasRightAxisMetrics && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(val) => (typeof val === "number" && val <= 1 ? `${(val * 100).toFixed(1)}%` : Number(val).toFixed(1))}
                    dx={10}
                  />
                )}
                <Tooltip
                  content={
                    <CustomGscTooltip
                      selectedMetrics={selectedMetrics}
                      isComparison={isComparison}
                      currentLabel={currentLabel}
                      comparisonLabel={comparisonLabel}
                    />
                  }
                />
                {selectedMetrics.map((mKey) => {
                  const cfg = METRIC_CONFIGS[mKey];
                  const yId = (mKey === "ctr" || mKey === "position") && hasCountMetrics ? "right" : "left";
                  return (
                    <React.Fragment key={mKey}>
                      <Bar
                        yAxisId={yId}
                        dataKey={mKey}
                        name={`${cfg.label} (Current)`}
                        fill={cfg.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      {isComparison && (
                        <Bar
                          yAxisId={yId}
                          dataKey={`${mKey}_comp`}
                          name={`${cfg.label} (Comparison)`}
                          fill={cfg.color}
                          fillOpacity={0.35}
                          stroke={cfg.color}
                          strokeDasharray="3 3"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  interval={0}
                  tickFormatter={(v, i) => chartData[i]?.label || ""}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickFormatter={(val) => (typeof val === "number" && val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val)}
                  dx={-10}
                />
                {hasRightAxisMetrics && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(val) => (typeof val === "number" && val <= 1 ? `${(val * 100).toFixed(1)}%` : Number(val).toFixed(1))}
                    dx={10}
                  />
                )}
                <Tooltip
                  content={
                    <CustomGscTooltip
                      selectedMetrics={selectedMetrics}
                      isComparison={isComparison}
                      currentLabel={currentLabel}
                      comparisonLabel={comparisonLabel}
                    />
                  }
                />
                {selectedMetrics.map((mKey) => {
                  const cfg = METRIC_CONFIGS[mKey];
                  const yId = (mKey === "ctr" || mKey === "position") && hasCountMetrics ? "right" : "left";
                  return (
                    <React.Fragment key={mKey}>
                      {/* Current Period Line — Solid Line */}
                      <Line
                        yAxisId={yId}
                        type="monotone"
                        dataKey={mKey}
                        name={`${cfg.label} (Current)`}
                        stroke={cfg.color}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: cfg.color, stroke: "#fff", strokeWidth: 2 }}
                      />
                      {/* Comparison Period Line — Dashed Line */}
                      {isComparison && (
                        <Line
                          yAxisId={yId}
                          type="monotone"
                          dataKey={`${mKey}_comp`}
                          name={`${cfg.label} (Comparison)`}
                          stroke={cfg.color}
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: cfg.color, stroke: "#fff", strokeWidth: 1.5 }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Search Queries & Top Landing Pages Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Queries Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Top Search Queries</h3>
            </div>
            {queryItems.length > 0 && (
              <div className="flex items-center gap-2">
                {isComparison && (
                  <TableMetricSelector
                    value={queryMetric}
                    onChange={(m) => setQueryMetric(m)}
                  />
                )}
                <RowCountSelector
                  value={queryRowCount}
                  customValue={queryCustomVal}
                  onChange={(mode, val) => {
                    setQueryRowCount(mode);
                    setQueryCustomVal(val);
                  }}
                />
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                  {queryItems.length}
                </span>
              </div>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasQueriesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Search Queries
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.queries}
              </p>
            </div>
          ) : queryItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console query data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No organic search keywords were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-light">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white text-center w-12">#</th>
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Query</th>
                    {isComparison ? (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[queryMetric]} Current
                        </th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[queryMetric]} Prev.
                        </th>
                        <th className="py-2.5 pl-3 pr-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          Difference
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                        <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedQueryItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-[12.5px] font-semibold text-slate-400 text-center font-mono w-12">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[180px] sm:max-w-[240px] truncate" title={item.query}>
                        {item.query}
                      </td>
                      {isComparison ? (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {renderMetricCurrentCell(item, queryMetric)}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-500 text-right font-mono">
                            {renderMetricPreviousCell(item, queryMetric)}
                          </td>
                          <td className="py-3 pl-3 pr-3 text-[13px] text-right font-mono">
                            {renderMetricDifferenceCell(item, queryMetric)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedClicks}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedImpressions}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                            {item.ctr}
                          </td>
                          <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                            {item.position}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Landing Pages Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Top Landing Pages</h3>
            </div>
            {pageItems.length > 0 && (
              <div className="flex items-center gap-2">
                {isComparison && (
                  <TableMetricSelector
                    value={pagesMetric}
                    onChange={(m) => setPagesMetric(m)}
                  />
                )}
                <RowCountSelector
                  value={pagesRowCount}
                  customValue={pagesCustomVal}
                  onChange={(mode, val) => {
                    setPagesRowCount(mode);
                    setPagesCustomVal(val);
                  }}
                />
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                  {pageItems.length}
                </span>
              </div>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasPagesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Landing Pages
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.pages}
              </p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console landing page data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No landing page performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-light">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white text-center w-12">#</th>
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Landing Page</th>
                    {isComparison ? (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[pagesMetric]} Current
                        </th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[pagesMetric]} Prev.
                        </th>
                        <th className="py-2.5 pl-3 pr-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          Difference
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                        <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedPageItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-[12.5px] font-semibold text-slate-400 text-center font-mono w-12">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] sm:max-w-[260px] truncate" title={item.pageUrl}>
                        <a
                          href={item.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {item.pageUrl}
                        </a>
                      </td>
                      {isComparison ? (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {renderMetricCurrentCell(item, pagesMetric)}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-500 text-right font-mono">
                            {renderMetricPreviousCell(item, pagesMetric)}
                          </td>
                          <td className="py-3 pl-3 pr-3 text-[13px] text-right font-mono">
                            {renderMetricDifferenceCell(item, pagesMetric)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedClicks}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedImpressions}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                            {item.ctr}
                          </td>
                          <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                            {item.position}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Geographic Breakdown & Device Breakdown Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Breakdown Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Geographic Breakdown</h3>
            </div>
            {countryItems.length > 0 && (
              <div className="flex items-center gap-2">
                {isComparison && (
                  <TableMetricSelector
                    value={countriesMetric}
                    onChange={(m) => setCountriesMetric(m)}
                  />
                )}
                <RowCountSelector
                  value={countriesRowCount}
                  customValue={countriesCustomVal}
                  onChange={(mode, val) => {
                    setCountriesRowCount(mode);
                    setCountriesCustomVal(val);
                  }}
                />
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                  {countryItems.length}
                </span>
              </div>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasCountriesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Geographic Breakdown
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.countries}
              </p>
            </div>
          ) : countryItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console country data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No country-level search performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-light">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white text-center w-12">#</th>
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Country</th>
                    {isComparison ? (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[countriesMetric]} Current
                        </th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[countriesMetric]} Prev.
                        </th>
                        <th className="py-2.5 pl-3 pr-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          Difference
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                        <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedCountryItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-[12.5px] font-semibold text-slate-400 text-center font-mono w-12">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] truncate" title={item.country}>
                        {item.country}
                      </td>
                      {isComparison ? (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {renderMetricCurrentCell(item, countriesMetric)}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-500 text-right font-mono">
                            {renderMetricPreviousCell(item, countriesMetric)}
                          </td>
                          <td className="py-3 pl-3 pr-3 text-[13px] text-right font-mono">
                            {renderMetricDifferenceCell(item, countriesMetric)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedClicks}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedImpressions}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                            {item.ctr}
                          </td>
                          <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                            {item.position}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device Breakdown Table Card */}
        <div className="dashboard-card p-6 relative flex flex-col h-[400px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h3 className="text-[15px] font-bold text-slate-800">Device Breakdown</h3>
            </div>
            {deviceItems.length > 0 && (
              <div className="flex items-center gap-2">
                {isComparison && (
                  <TableMetricSelector
                    value={devicesMetric}
                    onChange={(m) => setDevicesMetric(m)}
                  />
                )}
                <RowCountSelector
                  value={devicesRowCount}
                  customValue={devicesCustomVal}
                  onChange={(mode, val) => {
                    setDevicesRowCount(mode);
                    setDevicesCustomVal(val);
                  }}
                />
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                  {deviceItems.length}
                </span>
              </div>
            )}
          </div>

          {isLoadingAnalytics ? (
            <div className="flex-1 space-y-3 py-4 animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
              <div className="h-6 bg-slate-50 rounded-lg" />
            </div>
          ) : hasDevicesError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-50/60 border border-red-200 rounded-xl">
              <h4 className="text-[14px] font-semibold text-red-700 mb-1">
                Failed to load Device Breakdown
              </h4>
              <p className="text-[12.5px] text-red-500 max-w-xs mx-auto">
                {datasetErrors.devices}
              </p>
            </div>
          ) : deviceItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200/80 rounded-xl">
              <h4 className="text-[14px] font-semibold text-slate-700 mb-1">
                No Search Console device data is available for this period.
              </h4>
              <p className="text-[12.5px] text-slate-500 max-w-xs mx-auto">
                No device category search performance metrics were recorded in the selected date range.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-light">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white text-center w-12">#</th>
                    <th className="py-2.5 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 bg-white">Device</th>
                    {isComparison ? (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[devicesMetric]} Current
                        </th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          {BREAKDOWN_METRIC_LABELS[devicesMetric]} Prev.
                        </th>
                        <th className="py-2.5 pl-3 pr-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">
                          Difference
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Clicks</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Impressions</th>
                        <th className="py-2.5 px-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">CTR</th>
                        <th className="py-2.5 pl-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 text-right bg-white">Position</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedDeviceItems.map((item, idx) => (
                    <tr
                      key={item.id + idx}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${
                        idx % 2 === 1 ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-[12.5px] font-semibold text-slate-400 text-center font-mono w-12">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 text-[13px] font-medium text-slate-800 max-w-[200px] truncate" title={item.device}>
                        {item.device}
                      </td>
                      {isComparison ? (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {renderMetricCurrentCell(item, devicesMetric)}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-500 text-right font-mono">
                            {renderMetricPreviousCell(item, devicesMetric)}
                          </td>
                          <td className="py-3 pl-3 pr-3 text-[13px] text-right font-mono">
                            {renderMetricDifferenceCell(item, devicesMetric)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedClicks}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-800 text-right font-mono">
                            {item.formattedImpressions}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-emerald-600 text-right font-mono">
                            {item.ctr}
                          </td>
                          <td className="py-3 pl-3 text-[13px] font-semibold text-slate-700 text-right font-mono">
                            {item.position}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
