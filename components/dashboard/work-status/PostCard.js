"use client";

import { Calendar, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { platforms, assignees } from "@/app/dashboard/work-status/mockPosts";

// Reason: Individual Kanban post card that is draggable between columns.
// How: Uses @dnd-kit useSortable for drag-and-drop affordance. Renders platform
//      badge, title, content type tag, assignee avatar, due date, and priority dot.
// Receives: `post` object from KanbanColumn (parent: components/dashboard/work-status/KanbanColumn.js)
// Passes: nothing

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-green-400",
};

// Gradient placeholders for thumbnail images
const thumbnailGradients = [
  "from-indigo-200 to-purple-200",
  "from-pink-200 to-rose-200",
  "from-blue-200 to-cyan-200",
  "from-amber-200 to-orange-200",
  "from-emerald-200 to-teal-200",
];

export default function PostCard({ post }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const platform = platforms[post.platform];
  const assignee = assignees.find((a) => a.id === post.assignee);
  const gradientIdx =
    parseInt(post.id.replace("post-", ""), 10) % thumbnailGradients.length;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dashboard-card p-3.5 group cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-xl scale-[1.02]" : ""
      }`}
    >
      {/* Drag handle + priority */}
      <div className="flex items-center justify-between mb-2.5">
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        >
          <GripVertical className="w-4 h-4 text-slate-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${priorityColors[post.priority]}`}
          />
          <span className="text-[10px] text-slate-400 capitalize">
            {post.priority}
          </span>
        </div>
      </div>

      {/* Thumbnail placeholder */}
      <div
        className={`w-full h-24 rounded-lg bg-gradient-to-br ${thumbnailGradients[gradientIdx]} mb-3`}
      />

      {/* Platform badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${platform.bg} ${platform.text}`}
        >
          {platform.name}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-500">
          {post.contentType}
        </span>
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium text-slate-800 leading-snug mb-3 line-clamp-2">
        {post.title}
      </p>

      {/* Bottom row: assignee + date */}
      <div className="flex items-center justify-between">
        {/* Assignee avatar */}
        {assignee && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-semibold"
            style={{ backgroundColor: assignee.color }}
            title={assignee.name}
          >
            {assignee.initials}
          </div>
        )}

        {/* Due date */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar className="w-3 h-3" />
          {formatDate(post.dueDate)}
        </div>
      </div>
    </div>
  );
}
