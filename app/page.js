import Link from 'next/link';
import { ArrowRight, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#f8f9fb] to-[#eef2f6]">
      <div className="max-w-3xl w-full text-center space-y-8 glass-panel p-12 rounded-3xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
          Welcome to <span className="gradient-text">GrowthOS</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          The all-in-one client-facing marketing ROI and work-status dashboard.
        </p>
        
        <div className="pt-8 flex justify-center">
          <Link href="/auth">
            <button className="primary-button flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-medium">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
