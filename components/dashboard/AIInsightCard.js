"use client";

import { Sparkles } from "lucide-react";

// Reason: Prominent alert card that showcases AI-driven insights with a premium gradient design.
// How: Renders a gradient purple-to-blue card with a badge, headline prediction, supporting text,
//      and a CTA button. Uses a subtle animated glow effect via CSS.
// Receives: nothing (content is static/mock)
// Passes: nothing

export default function AIInsightCard() {
  return (
    <div className="ai-gradient-card col-span-full lg:col-span-4 relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between min-h-[200px]">
      {/* Animated glow orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
            AI Alert
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-[20px] font-bold text-white leading-tight mb-2">
          Predicted 18% Drop in Campaign X Reach
        </h3>
        <p className="text-[13px] text-white/70 leading-relaxed">
          Algorithm detected declining engagement. Re-align targeting to save $15k. Stabilize your timeline.
        </p>
      </div>

      {/* CTA */}
      <button className="relative z-10 mt-5 w-full py-3 bg-white text-indigo-700 font-bold text-[13px] rounded-xl hover:bg-white/90 transition-all tracking-wide uppercase">
        Adjust Strategy
      </button>
    </div>
  );
}
