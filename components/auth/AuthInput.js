"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Reason: Standardizes the input field appearance across all auth flows, ensuring accessibility labels and dynamic icon support.
// How: Receives a 'type' and 'icon' prop. If the type is 'password', it manages local state to toggle visibility using an absolute positioned button.
export default function AuthInput({ label, type = "text", icon: Icon, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          // How: Dynamically switches between 'text' and 'password' if the field is a password type and visibility is toggled.
          type={isPassword && showPassword ? "text" : type}
          className={`w-full bg-white text-slate-900 border border-slate-200 rounded-lg py-2.5 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${
            Icon ? "pl-10" : "pl-3"
          } ${isPassword ? "pr-10" : "pr-3"}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
