"use client";

import { AlertTriangle, Clock, Hash, Tag, User } from "lucide-react";
import { agents } from "@/app/dashboard/tickets/mockTickets";

export default function TicketDetailsPanel({ ticket }) {
  if (!ticket) return null;

  const assignee = agents[ticket.assignee];

  return (
    <div className="hidden lg:block w-[280px] bg-white border-l border-slate-200 h-full p-6 overflow-y-auto rounded-r-2xl">
      <h3 className="text-sm font-bold text-slate-900 mb-6">Ticket Details</h3>

      <div className="space-y-5">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Hash className="w-3 h-3" /> Ticket ID
          </span>
          <p className="text-[13px] text-slate-800 font-medium">{ticket.id}</p>
        </div>

        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Clock className="w-3 h-3" /> Created
          </span>
          <p className="text-[13px] text-slate-800 font-medium">{ticket.createdAt}</p>
        </div>

        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Tag className="w-3 h-3" /> Type & Priority
          </span>
          <div className="flex gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">
              {ticket.type}
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              ticket.priority === 'High' ? 'bg-red-50 text-red-700' : 
              ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 
              'bg-green-50 text-green-700'
            }`}>
              {ticket.priority} Priority
            </span>
          </div>
        </div>

        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <User className="w-3 h-3" /> Assignee
          </span>
          {assignee ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: assignee.color }}
              >
                {assignee.avatar}
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-800">{assignee.name}</p>
                <p className="text-[11px] text-slate-500">{assignee.role}</p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500 italic">Unassigned</p>
          )}
        </div>

        {ticket.relatedCampaign && (
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Related Campaign
            </span>
            <a href="#" className="text-[13px] text-indigo-600 font-medium hover:underline">
              {ticket.relatedCampaign}
            </a>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-semibold rounded-lg transition-colors">
          <AlertTriangle className="w-3.5 h-3.5" /> Escalate to Priority
        </button>
      </div>

      <div className="mt-6">
        <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Internal Notes (Agent Only)
        </span>
        <textarea
          rows="3"
          placeholder="Add a private note..."
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
        ></textarea>
      </div>
    </div>
  );
}
