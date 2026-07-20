"use client";

import { Monitor, Smartphone } from "lucide-react";
import { activeSessions } from "@/app/dashboard/settings/mockSettings";

export default function SecurityTab() {
  return (
    <div className="dashboard-card p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Change Password</h3>
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
          </div>
          <div className="pt-2">
            <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors">
              Update Password
            </button>
          </div>
        </form>
      </div>

      <div className="mb-10 pt-8 border-t border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900 mb-2">Two-Factor Authentication</h3>
        <p className="text-[13px] text-slate-500 mb-4">Add an extra layer of security to your account by requiring a verification code in addition to your password.</p>
        <button className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors">
          Set up 2FA
        </button>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900 mb-4">Active Sessions</h3>
        <div className="space-y-4">
          {activeSessions.map((session, idx) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-500 shadow-sm">
                  {idx === 0 ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{session.device}</p>
                  <p className="text-[11.5px] text-slate-500">{session.location} &middot; {session.lastActive}</p>
                </div>
              </div>
              <button className="text-[12px] font-semibold text-slate-500 hover:text-red-600 transition-colors">
                Log out
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
