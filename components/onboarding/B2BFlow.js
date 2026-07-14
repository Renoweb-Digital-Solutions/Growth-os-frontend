"use client";

import { useState } from "react";
import { ArrowLeft, Key, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SelfServeWizard from "./SelfServeWizard";

export default function B2BFlow({ onBack }) {
  // 'initial', 'invite_entry', 'self_serve'
  const [step, setStep] = useState("initial");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.length > 3) {
      // Dummy check, usually API call here
      setError("Invalid or expired invite code.");
    } else {
      setError("Please enter a valid invite code.");
    }
  };

  return (
    <div className="w-full mx-auto max-w-3xl relative">
      {step !== "self_serve" && (
        <button onClick={onBack} className="absolute -top-12 left-0 flex items-center text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === "initial" && (
          <motion.div key="initial" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel p-10 md:p-14 rounded-3xl card-shadow text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Agency Setup</h2>
            <p className="text-slate-500 mb-10 text-lg">Do you have an invite code from our sales team?</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("invite_entry")}
                className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-colors bg-white shadow-sm"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Yes, I have a code</h3>
                <p className="text-slate-500 text-sm">Redeem your pre-configured workspace.</p>
              </motion.button>
              
              <motion.button
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("self_serve")}
                className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50/50 transition-colors bg-white shadow-sm"
              >
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No, I'm new</h3>
                <p className="text-slate-500 text-sm">Set up a new workspace from scratch.</p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "invite_entry" && (
          <motion.div key="invite_entry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-8 md:p-12 rounded-3xl card-shadow max-w-xl mx-auto">
            <button onClick={() => setStep("initial")} className="flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Enter Invite Code</h2>
            <p className="text-slate-500 mb-8">Paste the invite code you received via email.</p>
            
            <form onSubmit={handleInviteSubmit} className="space-y-5">
              <div>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-4 text-center text-2xl tracking-widest uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="XXXX-XXXX"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setError("");
                  }}
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full primary-button py-4 rounded-xl font-medium text-lg">
                  Verify Code
                </button>
              </div>
              <div className="text-center pt-4">
                <button type="button" onClick={() => setStep("self_serve")} className="text-blue-600 hover:text-blue-700 font-medium">
                  Don't have one? Sign up instead.
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === "self_serve" && (
          <motion.div key="self_serve" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SelfServeWizard onBack={() => setStep("initial")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
