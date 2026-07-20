"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import TicketList from "@/components/dashboard/tickets/TicketList";
import TicketThread from "@/components/dashboard/tickets/TicketThread";
import TicketDetailsPanel from "@/components/dashboard/tickets/TicketDetailsPanel";
import { mockTickets } from "@/app/dashboard/tickets/mockTickets";

export default function TicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState(mockTickets[0]?.id || null);

  const selectedTicket = mockTickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-2">
      <PageHeader
        title="Ravi's Digital Store"
        subtitle="Manage client tickets and chats"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold ml-1">
          R
        </div>
      </PageHeader>

      {/* 3-Panel Layout Container */}
      <div className="flex-1 flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-0">
        <TicketList 
          tickets={mockTickets} 
          selectedTicketId={selectedTicketId} 
          onSelectTicket={setSelectedTicketId} 
        />
        <TicketThread ticket={selectedTicket} />
        <TicketDetailsPanel ticket={selectedTicket} />
      </div>
    </div>
  );
}
