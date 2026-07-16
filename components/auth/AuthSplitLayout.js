"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "Growth OS completely transformed how we manage our client onboarding and retention. It's the engine behind our 300% year-over-year scaling.",
    name: "Sarah Jenkins",
    title: "Director of Operations, TechScale",
    avatar: "https://i.pravatar.cc/150?img=32"
  },
  {
    quote: "The actionable insights and automated reporting saved our agency over 40 hours a week. It feels like we hired an entire ops team.",
    name: "Marcus Cole",
    title: "CEO, Elevate Digital",
    avatar: "https://i.pravatar.cc/150?img=11"
  },
  {
    quote: "Sleek, intuitive, and insanely powerful. Our clients love the transparent dashboard, and our churn rate has literally halved since switching.",
    name: "Elena Rodriguez",
    title: "Head of Client Success, Nexus",
    avatar: "https://i.pravatar.cc/150?img=44"
  }
];

const LOGOS = [
  "Linear",
  "Notion",
  "Stripe",
  "Figma",
  "Vercel",
  "Dropbox"
];

// Reason: We need a reusable, responsive layout component for authentication screens that splits the view between form and marketing content.
// How: On mobile, only the left (form) side renders. On large screens (lg:), the right (marketing) side becomes visible, using Flexbox to manage proportions.
export default function AuthSplitLayout({ children }) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Reason: Cycles testimonials to create an engaging, dynamic marketing panel without user interaction.
  // How: Uses a simple setInterval to advance the state index every 6 seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-white text-slate-900">
      {/* Left side: Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>

      {/* Right side: Branded Panel */}
      {/* Reason: Displays social proof and brand identity to increase conversion rates during onboarding. */}
      {/* How: Uses CSS keyframes (globals.css) and Framer Motion for premium staggered entrance animations. */}
      <div className="hidden lg:flex w-1/2 auth-split-gradient flex-col justify-between p-16 text-white relative overflow-hidden">
        
        {/* Background Meshes and Overlays */}
        <div className="noise-overlay" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500 rounded-full mix-blend-overlay filter blur-[120px] opacity-20 animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-600 rounded-full mix-blend-overlay filter blur-[140px] opacity-20 animate-blob-2" />
        
        {/* Faint dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="z-10 mt-12">
          {/* Reason: Staggered animation grabs attention smoothly when the page loads. */}
          {/* How: motion.h2 splits the text into lines/words conceptually, applying delay incrementally. */}
          <motion.h2 
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl font-bold leading-tight mb-6"
          >
            Scale your growth <br />
            with intelligent OS
          </motion.h2>
        </div>

        <div className="z-10 mb-8">
          {/* Testimonial Carousel */}
          <div className="mb-16 max-w-md min-h-[220px] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-400 mb-6">
                <path d="M10 11L8 15H11V19H5V11L7 7H10L10 11ZM20 11L18 15H21V19H15V11L17 7H20L20 11Z" fill="currentColor"/>
              </svg>
            </motion.div>
            
            <div className="relative min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <p className="text-xl font-light italic text-slate-100 mb-6 leading-relaxed">
                    "{TESTIMONIALS[currentTestimonial].quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/20 overflow-hidden shadow-xl">
                      <img src={TESTIMONIALS[currentTestimonial].avatar} alt={TESTIMONIALS[currentTestimonial].name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm tracking-wide">{TESTIMONIALS[currentTestimonial].name}</p>
                      <p className="text-xs text-teal-200/80 font-medium">{TESTIMONIALS[currentTestimonial].title}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-2 mt-8"
            >
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentTestimonial ? "w-6 bg-teal-400" : "bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </motion.div>
          </div>

          {/* Logos Marquee */}
          {/* Reason: Marquee animation signifies constant motion and wide adoption, building trust. */}
          {/* How: Uses a duplicated list of logos to create a seamless CSS transform loop. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-teal-300/80 uppercase">Trusted by innovative teams</span>
              <div className="h-px bg-teal-800/50 flex-1"></div>
            </div>
            
            <div className="overflow-hidden mask-edges py-2">
              <div className="animate-marquee gap-12 items-center">
                {/* Double the array for seamless infinite loop */}
                {[...LOGOS, ...LOGOS].map((logo, idx) => (
                  <div key={idx} className="w-auto px-4 h-8 flex items-center justify-center opacity-40 hover:opacity-100 hover:scale-105 transition-all duration-300">
                    <span className="text-xl font-bold tracking-tight text-white">{logo}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
