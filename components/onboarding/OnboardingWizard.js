"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Paintbrush, 
  LayoutDashboard,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Business Type",
  "Company Details",
  "Your Details",
  "Brand Color",
  "Pricing Tier"
];

// --- HSL Color Algorithm ---
// Reason: We need a dynamic way to generate a cohesive color palette from a single base hex color.
// How: Convert HEX to HSL (Hue, Saturation, Lightness). Then, shift the Lightness value up or down to create lighter/darker shades.

const hexToHSL = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return { h, s, l };
};

const HSLToHex = (h, s, l) => {
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  
  r = Math.round((r + m) * 255).toString(16);
  g = Math.round((g + m) * 255).toString(16);
  b = Math.round((b + m) * 255).toString(16);

  if (r.length === 1) r = "0" + r;
  if (g.length === 1) g = "0" + g;
  if (b.length === 1) b = "0" + b;

  return "#" + r + g + b;
};

const generateShades = (hex) => {
  try {
    const { h, s, l } = hexToHSL(hex);
    // Generate 4 shades: 2 lighter, 1 base, 2 darker
    // Ensure lightness stays within 5% and 95% bounds
    return [
      HSLToHex(h, s, Math.min(95, l + 30)), // Lighter 2
      HSLToHex(h, s, Math.min(85, l + 15)), // Lighter 1
      hex,                                  // Base
      HSLToHex(h, s, Math.max(15, l - 15)), // Darker 1
      HSLToHex(h, s, Math.max(5, l - 30))   // Darker 2
    ];
  } catch(e) {
    return [hex, hex, hex, hex, hex];
  }
};
// ----------------------------

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 30 : -30,
    opacity: 0
  })
};

export default function OnboardingWizard() {
  const router = useRouter();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    businessType: "", // 'b2b' | 'b2c'
    companyName: "",
    industry: "",
    companySize: "",
    b2bClients: "",
    companyWebsite: "",
    position: "",
    phoneNumber: "",
    brandColor: "#0f766e", // Default teal
    pricingTier: ""
  });

  const [shades, setShades] = useState(generateShades("#0f766e"));

  // On mount, fetch current user state to resume flow
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/auth");

        const res = await fetch("http://localhost:7007/api/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.user.onboardingComplete) {
            router.push("/dashboard");
            return;
          }
          
          setFormData(prev => ({
            ...prev,
            businessType: data.user.businessType || prev.businessType,
            companyName: data.user.companyName || prev.companyName,
            industry: data.user.industry || prev.industry,
            companySize: data.user.companySize || prev.companySize,
            b2bClients: data.user.b2bClients || prev.b2bClients,
            companyWebsite: data.user.companyWebsite || prev.companyWebsite,
            position: data.user.position || prev.position,
            phoneNumber: data.user.phoneNumber || prev.phoneNumber,
            brandColor: data.user.brandColor || prev.brandColor,
            pricingTier: data.user.pricingTier || prev.pricingTier
          }));
          
          if (data.user.brandColor) {
            setShades(generateShades(data.user.brandColor));
          }
          
          setCurrentStepIndex(data.user.onboardingStep || 0);
        }
      } catch (e) {
        console.error("Failed to fetch user state", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  // Update shades when color changes
  useEffect(() => {
    setShades(generateShades(formData.brandColor));
  }, [formData.brandColor]);

  const saveProgress = async (nextStepIndex, isComplete = false) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:7007/api/users/onboarding", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          onboardingStep: nextStepIndex,
          onboardingComplete: isComplete
        })
      });
      
      if (isComplete) {
        router.push("/dashboard");
      } else {
        setCurrentStepIndex(nextStepIndex);
      }
    } catch (e) {
      console.error("Failed to save progress", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    setDirection(1);
    if (currentStepIndex < STEPS.length - 1) {
      saveProgress(currentStepIndex + 1);
    } else {
      saveProgress(STEPS.length, true);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validators for each step
  const isValidStep = () => {
    switch (currentStepIndex) {
      case 0: return formData.businessType !== "";
      case 1: 
        const base1 = formData.companyName !== "" && formData.industry !== "" && formData.companySize !== "";
        if (formData.businessType === "b2b") return base1 && formData.b2bClients !== "";
        return base1;
      case 2: return formData.position !== "";
      case 3: return formData.brandColor !== "";
      case 4: return formData.pricingTier !== "";
      default: return true;
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading your profile...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      {/* Top Navigation / Progress Bar */}
      <div className="w-full max-w-4xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">G</div>
            GrowthOS
          </div>
          <div className="text-sm font-medium text-slate-500">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute top-4 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div>
          <motion.div 
            className="absolute top-4 left-0 h-1 bg-teal-600 -translate-y-1/2 rounded-full z-0" 
            initial={false}
            animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          ></motion.div>
          
          <div className="relative z-10 flex justify-between">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              
              return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isActive ? "#ffffff" : isCompleted ? "#0d9488" : "#ffffff",
                    borderColor: isActive || isCompleted ? "#0d9488" : "#e2e8f0",
                    color: isActive ? "#0d9488" : isCompleted ? "#ffffff" : "#94a3b8",
                    boxShadow: isActive ? "0 0 0 4px rgba(13, 148, 136, 0.15)" : "0 0 0 0px rgba(13, 148, 136, 0)"
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 relative"
                >
                  {isCompleted ? (
                    <motion.svg 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                      className="w-4 h-4 text-white"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <motion.polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  ) : (
                    idx + 1
                  )}
                </motion.div>
                <span className={`text-xs transition-colors duration-300 hidden md:block ${isActive ? "text-teal-700 font-bold" : isCompleted ? "text-slate-700 font-medium" : "text-slate-400 font-medium"}`}>
                  {step}
                </span>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStepIndex}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 h-fit relative overflow-hidden"
          >
            {/* Subtle background blob */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-teal-50 to-transparent opacity-50 pointer-events-none" />
            
            {/* STEP 1: Business Type */}
            {currentStepIndex === 0 && (
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm shadow-teal-100">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">How do you operate?</h2>
                    <p className="text-slate-500">We'll customize your experience based on your business model.</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.button 
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChange("businessType", "b2b")}
                    className={`group relative flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all duration-300 ${formData.businessType === 'b2b' ? 'border-teal-600 bg-teal-50/40 shadow-lg shadow-teal-500/10' : 'border-slate-100 bg-white hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10'}`}
                  >
                    <AnimatePresence>
                      {formData.businessType === 'b2b' && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1, type: "spring", bounce: 0.5 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-4 right-4 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className={`p-4 rounded-xl mb-5 transition-colors duration-300 ${formData.businessType === 'b2b' ? 'bg-teal-600 text-white' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 group-hover:from-teal-50 group-hover:to-teal-100 group-hover:text-teal-600'}`}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Agency (B2B)</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">I am an agency looking to buy the dashboard to manage clients.</p>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChange("businessType", "b2c")}
                    className={`group relative flex flex-col items-start p-6 rounded-2xl border-2 text-left transition-all duration-300 ${formData.businessType === 'b2c' ? 'border-teal-600 bg-teal-50/40 shadow-lg shadow-teal-500/10' : 'border-slate-100 bg-white hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10'}`}
                  >
                    <AnimatePresence>
                      {formData.businessType === 'b2c' && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1, type: "spring", bounce: 0.5 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-4 right-4 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className={`p-4 rounded-xl mb-5 transition-colors duration-300 ${formData.businessType === 'b2c' ? 'bg-teal-600 text-white' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 group-hover:from-teal-50 group-hover:to-teal-100 group-hover:text-teal-600'}`}>
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Client (B2C)</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">I am a client looking for marketing services from your agency.</p>
                  </motion.button>
                </div>
              </div>
            )}

            {/* STEP 2: Company Details */}
            {currentStepIndex === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your company</h2>
                <p className="text-slate-500 mb-8">Basic details to set up your account.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company / Agency Name *</label>
                    <input 
                      type="text" 
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                      placeholder="Acme Corp"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Industry *</label>
                      <select 
                        value={formData.industry}
                        onChange={(e) => handleChange("industry", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                      >
                        <option value="">Select industry</option>
                        {formData.businessType === 'b2b' ? (
                          <>
                            <option value="agency">Agency / Marketing</option>
                            <option value="saas">SaaS / Software</option>
                            <option value="consulting">Consulting</option>
                            <option value="professional">Professional Services</option>
                          </>
                        ) : (
                          <>
                            <option value="ecommerce">eCommerce</option>
                            <option value="retail">Retail</option>
                            <option value="food">Food & Beverage</option>
                            <option value="local">Local Services</option>
                            <option value="fashion">Fashion & Apparel</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Size *</label>
                      <select 
                        value={formData.companySize}
                        onChange={(e) => handleChange("companySize", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>
                  </div>

                  {formData.businessType === 'b2b' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">How many clients do you manage? *</label>
                      <select 
                        value={formData.b2bClients}
                        onChange={(e) => handleChange("b2bClients", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                      >
                        <option value="">Select range</option>
                        <option value="1-5">1-5 clients</option>
                        <option value="6-20">6-20 clients</option>
                        <option value="21-50">21-50 clients</option>
                        <option value="50+">50+ clients</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Website <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                      type="url" 
                      value={formData.companyWebsite}
                      onChange={(e) => handleChange("companyWebsite", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                      placeholder="https://acmecorp.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Your Details */}
            {currentStepIndex === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">A bit about you</h2>
                <p className="text-slate-500 mb-8">Help us personalize your experience.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Position *</label>
                    <select 
                      value={formData.position}
                      onChange={(e) => handleChange("position", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                    >
                      <option value="">Select your role</option>
                      <option value="founder">Founder / CEO</option>
                      {formData.businessType === 'b2b' ? (
                        <>
                          <option value="account_manager">Account Manager</option>
                          <option value="sales_lead">Head of Sales</option>
                        </>
                      ) : (
                        <>
                          <option value="marketing_head">Head of Marketing</option>
                          <option value="store_manager">Store Manager</option>
                        </>
                      )}
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {formData.position === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specify Role *</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                        placeholder="e.g. Operations Manager"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                      type="tel" 
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Brand Color */}
            {currentStepIndex === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Make it yours</h2>
                <p className="text-slate-500 mb-8">Choose a brand color to theme your workspace and client portals.</p>
                
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Color Picker Column */}
                  <div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-3">Select a base color</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={formData.brandColor}
                          onChange={(e) => handleChange("brandColor", e.target.value)}
                          className="w-16 h-16 rounded-xl cursor-pointer border-0 p-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Hex Code</span>
                          <input 
                            type="text" 
                            value={formData.brandColor}
                            onChange={(e) => handleChange("brandColor", e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase font-mono w-28 focus:outline-none focus:ring-2 focus:ring-teal-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3 block">Auto-Generated Palette</span>
                      <div className="flex gap-2">
                        {shades.map((shade, i) => (
                          <div 
                            key={i} 
                            className="w-10 h-10 rounded-lg shadow-sm"
                            style={{ backgroundColor: shade }}
                            title={shade}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        We use a lightness-shifting algorithm to generate accessible tonal shades from your base color.
                      </p>
                    </div>
                  </div>

                  {/* Live Preview Column */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
                    <span className="absolute top-2 right-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Preview</span>
                    
                    {/* Mock Dashboard Layout */}
                    <div className="flex h-40 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden mt-4">
                      {/* Sidebar */}
                      <div className="w-16 flex flex-col items-center py-4 gap-4" style={{ backgroundColor: shades[4] }}>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold" style={{ backgroundColor: shades[2] }}>G</div>
                        <div className="w-6 h-6 rounded opacity-50 bg-white"></div>
                        <div className="w-6 h-6 rounded opacity-50 bg-white"></div>
                      </div>
                      {/* Main */}
                      <div className="flex-1 p-4 flex flex-col gap-3">
                        <div className="h-4 w-24 rounded bg-slate-200"></div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-12 rounded" style={{ backgroundColor: shades[0] }}></div>
                          <div className="flex-1 h-12 rounded" style={{ backgroundColor: shades[1] }}></div>
                        </div>
                        <div className="mt-auto self-end">
                          <button className="px-3 py-1.5 rounded text-white text-xs font-medium" style={{ backgroundColor: shades[2] }}>
                            Create New
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Pricing Tier */}
            {currentStepIndex === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a plan</h2>
                <p className="text-slate-500 mb-8">Choose how you want to scale with GrowthOS.</p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <button 
                    onClick={() => handleChange("pricingTier", "starter")}
                    className={`flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${formData.pricingTier === 'starter' ? 'border-teal-600 shadow-md ring-4 ring-teal-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Starter</h3>
                    <div className="text-2xl font-black text-slate-900 mb-4">$49<span className="text-sm font-medium text-slate-500">/mo</span></div>
                    <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> 1 Team Member</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Basic Analytics</li>
                      {formData.businessType === 'b2b' && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Up to 5 Clients</li>}
                    </ul>
                  </button>

                  {/* Card 2 */}
                  <button 
                    onClick={() => handleChange("pricingTier", "growth")}
                    className={`flex flex-col p-6 rounded-2xl border-2 text-left transition-all relative ${formData.pricingTier === 'growth' ? 'border-teal-600 shadow-md ring-4 ring-teal-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-full">Most Popular</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Growth</h3>
                    <div className="text-2xl font-black text-slate-900 mb-4">$99<span className="text-sm font-medium text-slate-500">/mo</span></div>
                    <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> 5 Team Members</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Advanced Analytics</li>
                      {formData.businessType === 'b2b' && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Up to 50 Clients</li>}
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Custom Domains</li>
                    </ul>
                  </button>

                  {/* Card 3 */}
                  <button 
                    onClick={() => handleChange("pricingTier", "scale")}
                    className={`flex flex-col p-6 rounded-2xl border-2 text-left transition-all ${formData.pricingTier === 'scale' ? 'border-teal-600 shadow-md ring-4 ring-teal-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Scale</h3>
                    <div className="text-2xl font-black text-slate-900 mb-4">$299<span className="text-sm font-medium text-slate-500">/mo</span></div>
                    <ul className="text-sm text-slate-600 space-y-2 mb-6 flex-1">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Unlimited Members</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Dedicated Support</li>
                      {formData.businessType === 'b2b' && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> Unlimited Clients</li>}
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-600" /> White-labeling</li>
                    </ul>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
              <button 
                onClick={handleBack}
                disabled={currentStepIndex === 0 || isSaving}
                className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-colors ${currentStepIndex === 0 ? 'text-transparent cursor-default' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
              
              <motion.button 
                onClick={handleNext}
                disabled={!isValidStep() || isSaving}
                className={`group flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  !isValidStep() || isSaving 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40"
                }`}
                whileHover={isValidStep() && !isSaving ? { scale: 1.02 } : {}}
                whileTap={isValidStep() && !isSaving ? { scale: 0.98 } : {}}
              >
                {isSaving ? "Saving..." : currentStepIndex === STEPS.length - 1 ? "Complete Setup" : "Continue"}
                {!isSaving && currentStepIndex < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </motion.button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
