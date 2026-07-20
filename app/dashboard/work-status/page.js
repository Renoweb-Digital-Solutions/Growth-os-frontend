"use client";

import { Plus, Filter } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import KanbanBoard from "@/components/dashboard/work-status/KanbanBoard";

// Reason: Work Status page — Kanban board for tracking social media content pipeline.
// How: Renders PageHeader with filters and "+ New Post" button, then the KanbanBoard.
// Data Flow: mockPosts.js → KanbanBoard → KanbanColumn → PostCard

export default function WorkStatusPage() {
  return (
    <>
      <PageHeader
        title="Work Status"
        subtitle="Track your content pipeline"
      >
        {/* Filter pills */}
        <FilterDropdown label="Platform" />
        <FilterDropdown label="Assignee" />
        <FilterDropdown label="Content Type" />

        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </PageHeader>

      <KanbanBoard />
    </>
  );
}

function FilterDropdown({ label }) {
  return (
    <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] hover:border-slate-300 transition-colors">
      <Filter className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-slate-700 font-medium">{label}</span>
    </button>
  );
}
