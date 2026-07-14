"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RoleSelection from "../../components/onboarding/RoleSelection";
import B2CFlow from "../../components/onboarding/B2CFlow";
import B2BFlow from "../../components/onboarding/B2BFlow";

export default function OnboardingPage() {
  // 'role', 'b2c', 'b2b'
  const [currentStep, setCurrentStep] = useState("role");
  
  const renderStep = () => {
    switch (currentStep) {
      case "role":
        return <RoleSelection onSelect={(role) => setCurrentStep(role === "client" ? "b2c" : "b2b")} />;
      case "b2c":
        return <B2CFlow onBack={() => setCurrentStep("role")} />;
      case "b2b":
        return <B2BFlow onBack={() => setCurrentStep("role")} />;
      default:
        return <RoleSelection onSelect={(role) => setCurrentStep(role === "client" ? "b2c" : "b2b")} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements matching premium UI */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
