"use client";

export default function CallOptionCard({ 
  icon: Icon, 
  title, 
  description, 
  badge, 
  buttonText, 
  onClick, 
  isPriority 
}) {
  return (
    <div className={`dashboard-card p-6 flex flex-col h-full border ${isPriority ? "border-red-100 bg-red-50/10" : "border-slate-100"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPriority ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-slate-100 text-slate-600">
          {badge}
        </span>
      </div>
      
      <h3 className="text-[17px] font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-[13px] text-slate-500 mb-6 flex-1">{description}</p>
      
      <button 
        onClick={onClick}
        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-colors shadow-sm ${
          isPriority 
            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}
