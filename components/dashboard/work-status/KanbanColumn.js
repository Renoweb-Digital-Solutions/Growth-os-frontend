"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import PostCard from "./PostCard";

// Reason: Single Kanban column that acts as a droppable zone for post cards.
// How: Uses @dnd-kit useDroppable to register as a drop target. Wraps its post
//      cards in SortableContext for ordering within the column. Renders column
//      header with colored dot, title, count badge, and add button.
// Receives: `column` (config object), `posts` (array of posts in this column)
//           from KanbanBoard (parent: components/dashboard/work-status/KanbanBoard.js)
// Passes: `post` to PostCard (child: components/dashboard/work-status/PostCard.js)

export default function KanbanColumn({ column, posts }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-[320px] lg:w-auto lg:flex-1 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
          <h3 className="text-[14px] font-semibold text-slate-800">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full">
            {posts.length}
          </span>
        </div>
        <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-3 p-2 rounded-xl transition-colors min-h-[200px] ${
          isOver ? "bg-indigo-50/50 ring-2 ring-indigo-200 ring-inset" : "bg-slate-50/50"
        }`}
      >
        <SortableContext
          items={posts.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
