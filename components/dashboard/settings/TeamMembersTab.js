"use client";

import { useState } from "react";
import { Plus, X, MoreHorizontal, Mail } from "lucide-react";
import { teamMembers } from "@/app/dashboard/settings/mockSettings";

export default function TeamMembersTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="dashboard-card p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
          <p className="text-[13px] text-slate-500 mt-1">Manage who has access to this workspace.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-indigo-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">Member</th>
              <th className="py-3 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
              <th className="py-3 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="py-3 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {teamMembers.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                      <p className="text-[12px] text-slate-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select 
                    defaultValue={member.role}
                    className="bg-transparent text-[13px] text-slate-700 font-medium focus:outline-none hover:text-indigo-600 cursor-pointer"
                  >
                    <option>Admin</option>
                    <option>Editor</option>
                    <option>Viewer</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                    member.status === "Active" 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-[13px] font-medium text-red-500 hover:text-red-700 transition-colors">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Invite Team Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" placeholder="colleague@company.com" className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Role</label>
                <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white">
                  <option value="Viewer">Viewer - Can view reports and dashboards</option>
                  <option value="Editor">Editor - Can create and manage content</option>
                  <option value="Admin">Admin - Full access including billing and settings</option>
                </select>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
