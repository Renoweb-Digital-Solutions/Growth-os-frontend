"use client";

import { useState } from "react";
import { Plus, CreditCard, MoreHorizontal, X } from "lucide-react";
import { paymentMethods } from "@/app/dashboard/settings/mockSettings";

export default function PaymentMethodsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="dashboard-card p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Method
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {paymentMethods.map(pm => (
          <div key={pm.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                  {pm.brand} ending in {pm.last4}
                  {pm.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-[12px] text-slate-500">Expires {pm.expiry}</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-[14px] font-semibold text-slate-800 mb-3">Billing Address</h4>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800 mb-1">Growth OS Inc.</p>
          <p>123 Innovation Drive, Suite 400</p>
          <p>San Francisco, CA 94105</p>
          <p>United States</p>
          <button className="mt-3 text-indigo-600 hover:underline font-medium">Edit address</button>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Payment Method</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Card Number</label>
                <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Expiry Date</label>
                  <input type="text" placeholder="MM/YY" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">CVC</label>
                  <input type="text" placeholder="123" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Name on Card</label>
                <input type="text" placeholder="John Doe" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white" />
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors"
              >
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
