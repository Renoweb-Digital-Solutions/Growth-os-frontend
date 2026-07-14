import { BarChart3, Home as HomeIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6">
        <div className="flex items-center text-xl font-bold text-slate-900 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm">G</span>
          </div>
          GrowthOS
        </div>
        
        <nav className="space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <HomeIcon className="w-5 h-5 mr-3" />
            Overview
          </Link>
          <div className="flex items-center px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium cursor-not-allowed">
            <BarChart3 className="w-5 h-5 mr-3" />
            Reports (Coming Soon)
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 md:p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to your dashboard</h1>
          <p className="text-slate-500 mt-2">Setup complete. Your workspace is ready.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Placeholder Widgets */}
          <div className="glass-panel p-6 rounded-2xl bg-white card-shadow md:col-span-2 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Analytics Empty</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-2">Connect your first ad account or data source to start generating marketing ROI reports.</p>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl bg-white card-shadow flex items-center justify-center min-h-[300px]">
            <p className="text-slate-400 text-sm">Widget Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
