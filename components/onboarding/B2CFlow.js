"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function B2CFlow({ onBack }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else {
      // Dummy API call to register/login B2C user
      // Assuming success, redirect to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-3xl w-full mx-auto card-shadow max-w-xl">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h2>
            <p className="text-slate-500 mb-8">Join your agency's workspace to view your dashboard.</p>
            
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              
              <div className="pt-4">
                <button type="submit" className="w-full primary-button py-3 rounded-xl font-medium">
                  Continue with Email
                </button>
              </div>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2" alt="Google" />
                  Google
                </button>
                <button type="button" className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-5 h-5 mr-2" alt="LinkedIn" />
                  LinkedIn
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Almost there</h2>
            <p className="text-slate-500 mb-8 text-center">We found a pending invite for {formData.email}. Please confirm your details.</p>
            
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full primary-button py-3 rounded-xl font-medium">
                  Complete Setup
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
