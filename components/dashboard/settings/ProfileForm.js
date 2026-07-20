"use client";

import { useState } from "react";
import { userProfile } from "@/app/dashboard/settings/mockSettings";
import { Camera } from "lucide-react";

export default function ProfileForm() {
  const [formData, setFormData] = useState(userProfile);

  return (
    <div className="dashboard-card p-6 md:p-8 max-w-3xl">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Settings</h3>
      
      {/* Avatar upload */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-600 hover:text-indigo-600 transition-colors">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-lg hover:bg-slate-50 transition-colors mb-2">
            Change Photo
          </button>
          <p className="text-[11px] text-slate-500">JPG, GIF or PNG. Max size of 2MB.</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={e => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all" 
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all" 
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all" 
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Job Title</label>
            <input 
              type="text" 
              value={formData.jobTitle}
              onChange={e => setFormData({...formData, jobTitle: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Time Zone</label>
          <select 
            value={formData.timezone}
            onChange={e => setFormData({...formData, timezone: e.target.value})}
            className="w-full md:w-1/2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
          >
            <option>{formData.timezone}</option>
            <option>UTC -08:00 Pacific Time</option>
            <option>UTC +00:00 GMT</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-indigo-500/20 transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
