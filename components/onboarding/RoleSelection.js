"use client";

import { User, Building2 } from "lucide-react";
import { motion } from "framer-motion";

// Reason: First step in the onboarding flow to segment users into different operational paths.
// How: Presents two distinct paths (Client vs Agency). Triggers the `onSelect` callback passed from the parent page with the selected role identifier.
export default function RoleSelection({ onSelect }) {
  return (
    <div className="glass-panel p-10 md:p-14 rounded-3xl w-full mx-auto card-shadow max-w-2xl text-center">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to GrowthOS</h2>
      <p className="text-slate-500 mb-10 text-lg">Let's get your workspace set up. How will you be using the platform?</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("client")}
          className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-colors bg-white shadow-sm"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">I'm a Client</h3>
          <p className="text-slate-500 text-sm">Viewing my dashboard and reports.</p>
        </motion.button>
        
        <motion.button
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("agency")}
          className="flex flex-col items-center p-8 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50/50 transition-colors bg-white shadow-sm"
        >
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">I'm an Agency / Business</h3>
          <p className="text-slate-500 text-sm">Managing clients and generating reports.</p>
        </motion.button>
      </div>
    </div>
  );
}
