"use client";

import { Paperclip, Send, ChevronDown } from "lucide-react";
import { useState } from "react";
import { agents } from "@/app/dashboard/tickets/mockTickets";

const statusColors = {
  Open: "bg-indigo-50 text-indigo-700",
  Pending: "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

export default function TicketThread({ ticket }) {
  const [reply, setReply] = useState("");

  if (!ticket) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
      <p className="text-slate-400 text-sm">Select a ticket to view the conversation</p>
    </div>
  );

  const assignee = agents[ticket.assignee];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50/30">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100 flex-shrink-0 flex justify-between items-center">
        <div className="min-w-0 pr-4">
          <h2 className="text-lg font-bold text-slate-900 truncate mb-1">{ticket.subject}</h2>
          <p className="text-xs text-slate-500 truncate">
            Opened {ticket.createdAt} &middot; Assigned to <span className="font-medium text-slate-700">{assignee?.name || "Unassigned"}</span>
          </p>
        </div>
        <div className="flex-shrink-0">
          <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border shadow-sm ${statusColors[ticket.status]} border-current/20`}>
            {ticket.status} <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {ticket.messages.map(msg => {
          const isUser = msg.sender === "user";
          const agent = !isUser ? agents[msg.agentId] : null;

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
              <div className="flex items-end gap-2 max-w-[85%]">
                {!isUser && agent && (
                  <div 
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mb-1"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.avatar}
                  </div>
                )}
                
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  isUser 
                    ? "bg-indigo-600 text-white rounded-br-sm" 
                    : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
              
              <div className={`mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? "mr-1" : "ml-9"}`}>
                {!isUser && agent && (
                  <span className="font-medium text-slate-500">{agent.name} &middot; {agent.role}</span>
                )}
                <span>{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 focus-within:bg-white transition-all p-2 flex items-end gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            rows="1"
            placeholder="Type your reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-500/20">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
