"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building, Palette, CreditCard, Send, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SelfServeWizard({ onBack }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    brandColors: ["#3b82f6", "#8b5cf6", "#1e293b"],
    planTier: "",
    enterpriseMessage: "",
    contactEmail: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => step === 1 ? onBack() : setStep(s => s - 1);

  const randomizeColors = () => {
    const randomColor = () => "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setFormData({ ...formData, brandColors: [randomColor(), randomColor(), randomColor()] });
  };
  
  const useDefaultColors = () => {
    setFormData({ ...formData, brandColors: ["#3b82f6", "#8b5cf6", "#1e293b"] });
  };

  const handleUpdateColor = (index, color) => {
    const newColors = [...formData.brandColors];
    newColors[index] = color;
    setFormData({ ...formData, brandColors: newColors });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);

    if (formData.planTier === "enterprise_pending") {
      setLeadSubmitted(true);
    } else {
      router.push("/dashboard");
    }
  };

  if (leadSubmitted) {
    return (
      <div className="glass-panel p-12 rounded-3xl card-shadow text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Request Submitted</h2>
        <p className="text-slate-500 mb-8 text-lg">Thank you! Our sales team will reach out to you shortly to discuss your custom enterprise needs.</p>
        <button onClick={() => router.push("/")} className="primary-button px-8 py-3 rounded-xl font-medium">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 md:p-12 rounded-3xl card-shadow max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-center mb-10">
        <button onClick={prevStep} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <div className="flex space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 w-8 rounded-full transition-colors ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Company Information</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Acme Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Workspace Description</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32 resize-none"
                  placeholder="What does your company do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={nextStep} 
                  disabled={!formData.companyName}
                  className="primary-button px-8 py-3 rounded-xl font-medium flex items-center disabled:opacity-50"
                >
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Palette className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Brand Identity</h2>
            </div>
            <p className="text-slate-500 mb-6">Choose your brand colors to customize your client dashboard.</p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <label className="text-xs font-medium text-slate-500 mb-2 uppercase">Color {i + 1}</label>
                    <div className="relative w-full h-24 rounded-2xl overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-blue-500 transition-colors">
                      <input 
                        type="color" 
                        value={formData.brandColors[i]}
                        onChange={(e) => handleUpdateColor(i, e.target.value)}
                        className="absolute inset-[-10px] w-[150%] h-[150%] cursor-pointer"
                      />
                    </div>
                    <span className="mt-2 text-sm font-mono text-slate-600">{formData.brandColors[i]}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4 pt-4">
                <button onClick={randomizeColors} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Randomize Colors
                </button>
                <button onClick={useDefaultColors} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Use Default Theme
                </button>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button onClick={nextStep} className="primary-button px-8 py-3 rounded-xl font-medium flex items-center">
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && formData.planTier !== "enterprise_pending" && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Select Plan</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { id: "tier1", name: "Starter", desc: "For small teams" },
                { id: "tier2", name: "Pro", desc: "For growing agencies" },
                { id: "enterprise_pending", name: "Enterprise", desc: "Custom needs" }
              ].map((tier) => (
                <div 
                  key={tier.id}
                  onClick={() => setFormData({ ...formData, planTier: tier.id })}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${formData.planTier === tier.id ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600 ring-opacity-20' : 'border-slate-200 hover:border-blue-300'}`}
                >
                  <h3 className="font-bold text-slate-900 mb-1">{tier.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{tier.desc}</p>
                  <div className="text-sm font-medium text-blue-600">
                    {tier.id === "enterprise_pending" ? "Contact Us" : "Select Plan"}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={formData.planTier === "enterprise_pending" ? () => {} : handleFinish}
                disabled={!formData.planTier || isSubmitting}
                className="primary-button px-8 py-3 rounded-xl font-medium flex items-center disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : (formData.planTier === "enterprise_pending" ? "Continue to Sales" : "Complete Setup")}
                {!isSubmitting && <CheckCircle className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </motion.div>
        )}
        
        {step === 3 && formData.planTier === "enterprise_pending" && (
          <motion.div key="enterprise_form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's discuss your needs</h2>
            <p className="text-slate-500 mb-6">Tell us a bit about your agency and our sales team will reach out to configure your Enterprise plan.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Work Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="you@company.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                  placeholder="What are your specific requirements?"
                  value={formData.enterpriseMessage}
                  onChange={(e) => setFormData({ ...formData, enterpriseMessage: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setFormData({ ...formData, planTier: "" })} className="text-slate-500 hover:text-slate-900 text-sm font-medium">
                Choose a different plan
              </button>
              <button 
                onClick={handleFinish}
                disabled={!formData.contactEmail || isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium flex items-center disabled:opacity-50 transition-colors shadow-lg shadow-slate-900/20"
              >
                {isSubmitting ? "Sending..." : "Submit to Sales"}
                {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
