"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function TimeSlotPicker({ isOpen, onClose }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);

  if (!isOpen) return null;

  const days = ["Mon, Jul 20", "Tue, Jul 21", "Wed, Jul 22"];
  const times = [
    "09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Select a Time</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
            {days.map((day, idx) => (
              <button
                key={day}
                onClick={() => { setSelectedDay(idx); setSelectedTime(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors border ${
                  selectedDay === idx 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {times.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2.5 rounded-xl text-[12px] font-medium transition-colors border ${
                  selectedTime === time
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {time}
              </button>
            ))}
          </div>

          <button 
            disabled={!selectedTime}
            onClick={() => {
              alert(`Booked for ${days[selectedDay]} at ${selectedTime}`);
              onClose();
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
