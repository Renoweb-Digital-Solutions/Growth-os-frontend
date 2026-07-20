"use client";

import { useState } from "react";

function Toggle({ label, description, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="pr-8">
        <p className="text-[14px] font-semibold text-slate-800 mb-0.5">{label}</p>
        <p className="text-[12.5px] text-slate-500">{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function NotificationsTab() {
  return (
    <div className="dashboard-card p-6 md:p-8 max-w-3xl">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Notifications</h3>
      
      <div className="mb-8">
        <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2">Email Notifications</h4>
        <div className="bg-white rounded-xl">
          <Toggle 
            label="Weekly Performance Digest" 
            description="Get a weekly summary of your key growth metrics." 
            defaultChecked={true} 
          />
          <Toggle 
            label="Campaign Alerts" 
            description="Receive alerts when campaigns stop spending or flag issues." 
            defaultChecked={true} 
          />
          <Toggle 
            label="Ticket Updates" 
            description="Get notified when a support agent replies to your tickets." 
            defaultChecked={true} 
          />
          <Toggle 
            label="Product Updates" 
            description="News about product and feature updates." 
            defaultChecked={false} 
          />
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2">Push Notifications (Browser)</h4>
        <div className="bg-white rounded-xl">
          <Toggle 
            label="Enable Push Notifications" 
            description="Receive real-time alerts in your browser while using Growth OS." 
            defaultChecked={false} 
          />
        </div>
      </div>
    </div>
  );
}
