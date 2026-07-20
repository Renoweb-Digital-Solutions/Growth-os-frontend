"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import CallOptionCard from "@/components/dashboard/book-call/CallOptionCard";
import UpcomingCallsList from "@/components/dashboard/book-call/UpcomingCallsList";
import TimeSlotPicker from "@/components/dashboard/book-call/TimeSlotPicker";
import { AlertCircle, Calendar } from "lucide-react";

export default function BookCallPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Book a Call"
        subtitle="Connect with our team for support or strategy"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <CallOptionCard 
          icon={AlertCircle}
          title="Priority Call"
          description="For urgent issues — campaign outages, billing problems, or time-sensitive escalations. Connects you to the next available agent."
          badge="Avg. wait: ~5 min"
          buttonText="Request Priority Call"
          isPriority={true}
          onClick={() => alert("Priority call requested!")}
        />
        
        <CallOptionCard 
          icon={Calendar}
          title="Schedule a Call"
          description="Book time with your account manager or a growth strategist for planning, reviews, or general questions."
          badge="Avg. response: same day"
          buttonText="View Available Times"
          isPriority={false}
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <UpcomingCallsList />

      <TimeSlotPicker isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
