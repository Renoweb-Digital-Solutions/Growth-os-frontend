"use client";

import { upcomingCalls, callHistory } from "@/app/dashboard/book-call/mockCalls";
import { Video, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function UpcomingCallsList() {
  return (
    <div className="space-y-6">
      <div className="dashboard-card p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-5">Your Upcoming Calls</h3>
        
        {upcomingCalls.length === 0 ? (
          <p className="text-[13px] text-slate-500 text-center py-4">No upcoming calls.</p>
        ) : (
          <div className="space-y-3">
            {upcomingCalls.map(call => (
              <div key={call.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: call.agentColor }}
                  >
                    {call.agentAvatar}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">Call with {call.agentName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] text-slate-500">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {call.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {call.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${call.type === 'Priority Call' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {call.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[12px] font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Reschedule
                  </button>
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-medium rounded-lg shadow-sm shadow-indigo-500/20 transition-colors">
                    <Video className="w-3.5 h-3.5" /> Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card p-6 overflow-hidden">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Call History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Agent</th>
                <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Duration</th>
                <th className="pb-3 pr-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="pb-3 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              {callHistory.map((call, idx) => (
                <tr key={call.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4 text-[13px] text-slate-600">{call.date}</td>
                  <td className="py-3.5 pr-4 text-[13px] font-medium text-slate-800">{call.agentName}</td>
                  <td className="py-3.5 pr-4 text-[13px] text-slate-600">{call.duration}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${call.type === 'Priority Call' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {call.type}
                    </span>
                  </td>
                  <td className="py-3.5 text-[13px]">
                    <a href="#" className="text-indigo-600 hover:underline font-medium">View notes</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
