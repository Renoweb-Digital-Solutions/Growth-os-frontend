"use client";

import { MessageCircle, Ticket as TicketIcon, Search, Plus } from "lucide-react";
import { useState } from "react";

const statusColors = {
  Open: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function TicketList({ tickets, selectedTicketId, onSelectTicket }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filters = ["All", "Open", "Pending", "Resolved"];

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === "All" || t.status === filter;
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] flex flex-col bg-white border-r border-slate-200 h-full max-h-screen rounded-l-2xl shadow-[inset_-1px_0_0_0_#f1f5f9]">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Tickets</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No tickets found.</div>
        ) : (
          filteredTickets.map(t => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors relative flex gap-3 ${
                selectedTicketId === t.id ? "bg-indigo-50/40 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-500" : "hover:bg-slate-50"
              }`}
            >
              <div className="mt-1 flex-shrink-0">
                {t.type === "chat" ? (
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                ) : (
                  <TicketIcon className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">{t.id}</span>
                  <span className="text-[10px] text-slate-400">{t.createdAt}</span>
                </div>
                <h3 className={`text-[13px] font-semibold mb-2 truncate ${selectedTicketId === t.id ? "text-indigo-900" : "text-slate-800"}`}>
                  {t.subject}
                </h3>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[t.status]}`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
