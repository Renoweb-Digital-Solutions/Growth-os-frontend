"use client";

import React, { useState } from "react";
import { Mail, Lock, Zap, User, Key, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import AuthInput from "../../components/auth/AuthInput";

// Reason: Centralized authentication route that handles both Registration and Login natively.
// How: Uses local component state (`activeTab`, `authMethod`) to render the correct form fields. Submits data to backend via fetch.
export default function AuthPage() {
  const router = useRouter();
  
  // Central States for UI flow control
  const [activeTab, setActiveTab] = useState("signin"); // "signin" | "signup"
  const [authMethod, setAuthMethod] = useState("email"); // "email" | "code"
  
  // Forgot Password State Machine
  // Reason: Controls the 3-step OTP password reset flow without changing URLs.
  // How: Switches between 'email', 'otp', 'new-password' views, or null if in normal auth flow.
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null); // null | "email" | "otp" | "new-password" | "success"
  const [resetToken, setResetToken] = useState("");

  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    inviteCode: "",
    otp: "",
    newPassword: ""
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reason: Handles the submission of standard auth forms (Login/Signup).
  // How: Validates inputs, makes POST requests to backend, stores JWT and redirects.
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (activeTab === "signin") {
        // Standard Email Login
        const res = await fetch("http://localhost:7007/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Something went wrong");
        
        localStorage.setItem("token", data.token);
        if (data.user && !data.user.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }

      } else {
        if (authMethod === "code") {
          await new Promise(r => setTimeout(r, 500));
          setIsLoading(false);
          return;
        }

        // Standard Email Sign Up
        const res = await fetch("http://localhost:7007/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Something went wrong");
        
        localStorage.setItem("token", data.token);
        if (data.user && !data.user.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reason: Handles the 3-step password reset submission flow.
  // How: Branches logic based on the current `forgotPasswordStep` state and calls the respective API endpoint.
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (forgotPasswordStep === "email") {
        // Step 1: Request OTP
        const res = await fetch("http://localhost:7007/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not send OTP");
        setForgotPasswordStep("otp");
      } 
      else if (forgotPasswordStep === "otp") {
        // Step 2: Verify OTP
        const res = await fetch("http://localhost:7007/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid OTP");
        setResetToken(data.resetToken);
        setForgotPasswordStep("new-password");
      }
      else if (forgotPasswordStep === "new-password") {
        // Step 3: Set New Password
        const res = await fetch("http://localhost:7007/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetToken, newPassword: formData.newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reset password");
        setForgotPasswordStep("success");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => {
    if (forgotPasswordStep) {
      return {
        title: "Reset Password",
        subtitle: forgotPasswordStep === "email" ? "Enter your email to receive a secure OTP code." :
                  forgotPasswordStep === "otp" ? "Enter the 6-digit code sent to your email." :
                  forgotPasswordStep === "new-password" ? "Choose a strong, new password." : 
                  "Password reset successfully."
      };
    }
    return {
      title: activeTab === "signin" ? "Welcome Back!" : "Create an Account",
      subtitle: activeTab === "signin" ? "Please enter your details to sign in." : "Join us today to supercharge your growth."
    };
  };

  const headerText = renderHeader();

  return (
    <AuthSplitLayout>
      <div className="mb-10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
          <Zap className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-slate-900 tracking-tight">GrowthOS</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{headerText.title}</h1>
        <p className="text-slate-500 text-sm">{headerText.subtitle}</p>
      </div>

      {!forgotPasswordStep && (
        <div className="flex p-1 bg-slate-100 rounded-lg mb-8">
          <button 
            onClick={() => { setActiveTab("signin"); setError(""); setAuthMethod("email"); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setActiveTab("signup"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Sign Up
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Forgot Password Flow */}
      {forgotPasswordStep && forgotPasswordStep !== "success" && (
        <form onSubmit={handleForgotPasswordSubmit}>
          {forgotPasswordStep === "email" && (
            <AuthInput
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@company.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          )}

          {forgotPasswordStep === "otp" && (
            <AuthInput
              label="6-Digit OTP"
              type="text"
              icon={Key}
              placeholder="123456"
              required
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
            />
          )}

          {forgotPasswordStep === "new-password" && (
            <AuthInput
              label="New Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? "Processing..." : 
              forgotPasswordStep === "email" ? "Send Reset OTP" :
              forgotPasswordStep === "otp" ? "Verify OTP" : "Reset Password"
            }
          </button>
          
          <button 
            type="button" 
            onClick={() => { setForgotPasswordStep(null); setError(""); }}
            className="w-full mt-4 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
          </button>
        </form>
      )}

      {/* Forgot Password Success State */}
      {forgotPasswordStep === "success" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <button 
            onClick={() => { setForgotPasswordStep(null); setActiveTab("signin"); }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] flex justify-center items-center"
          >
            Return to Sign In
          </button>
        </div>
      )}

      {/* Standard Auth Flow */}
      {!forgotPasswordStep && (
        <form onSubmit={handleAuthSubmit}>
          {activeTab === "signup" && authMethod === "email" && (
            <AuthInput
              label="Full Name"
              type="text"
              icon={User}
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}

          {(activeTab === "signin" || (activeTab === "signup" && authMethod === "email")) && (
            <>
              <AuthInput
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="name@company.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <div className="relative">
                <AuthInput
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {activeTab === "signin" && (
                  <button 
                    type="button" 
                    onClick={() => { setForgotPasswordStep("email"); setError(""); }}
                    className="absolute top-0 right-0 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors mt-1"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === "signup" && authMethod === "code" && (
            <AuthInput
              label="Invite Code"
              type="text"
              icon={Key}
              placeholder="XXXX-XXXX"
              required
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
            />
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? "Processing..." : (activeTab === "signin" ? "Sign In" : "Sign Up")}
          </button>

          {activeTab === "signup" && (
            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => { setAuthMethod(m => m === "email" ? "code" : "email"); setError(""); }}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                {authMethod === "email" ? "Use Coded Sign Up instead" : "Use Email Sign Up instead"}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Social Logins */}
      {!forgotPasswordStep && (
        <>
          <div className="relative flex items-center py-6 mt-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium tracking-wider">or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button type="button" className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 mr-2" alt="Google" />
              Google
            </button>
            <button type="button" className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-700">
              <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-4 h-4 mr-2" alt="LinkedIn" />
              LinkedIn
            </button>
          </div>
        </>
      )}

    </AuthSplitLayout>
  );
}
