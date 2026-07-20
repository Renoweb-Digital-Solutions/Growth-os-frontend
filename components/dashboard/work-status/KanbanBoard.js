"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import PostCard from "./PostCard";
import { columns, initialPosts } from "@/app/dashboard/work-status/mockPosts";

// Reason: Core Kanban board component that manages drag-and-drop state across 3 columns.
// How: Wraps columns in a DndContext from @dnd-kit. Handles onDragStart, onDragOver,
//      and onDragEnd to move cards between columns and reorder within a column.
//      Uses closestCorners collision detection for accurate drop targeting.
// Receives: nothing (reads initial data from mockPosts)
// Passes: `column` and `posts` to KanbanColumn (child: components/dashboard/work-status/KanbanColumn.js)

export default function KanbanBoard() {
  const [posts, setPosts] = useState(initialPosts);
  const [activeId, setActiveId] = useState(null);

  // Reason: PointerSensor with activation distance prevents accidental drags on click.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const activePost = posts.find((p) => p.id === activeId);

  // Reason: Find which column a given post or column ID belongs to.
  const findColumnId = (id) => {
    // Check if id is a column id directly
    if (columns.find((c) => c.id === id)) return id;
    // Otherwise find the post's column
    const post = posts.find((p) => p.id === id);
    return post?.columnId || null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumnId = findColumnId(active.id);
    const overColumnId = findColumnId(over.id);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;

    // Move post to new column
    setPosts((prev) =>
      prev.map((p) =>
        p.id === active.id ? { ...p, columnId: overColumnId } : p
      )
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeColumnId = findColumnId(active.id);
    const overColumnId = findColumnId(over.id);

    if (!activeColumnId || !overColumnId) return;

    if (active.id !== over.id && activeColumnId === overColumnId) {
      // Reorder within same column
      setPosts((prev) => {
        const columnPosts = prev.filter((p) => p.columnId === activeColumnId);
        const otherPosts = prev.filter((p) => p.columnId !== activeColumnId);
        const oldIndex = columnPosts.findIndex((p) => p.id === active.id);
        const newIndex = columnPosts.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(columnPosts, oldIndex, newIndex);
        return [...otherPosts, ...reordered];
      });
    } else if (activeColumnId !== overColumnId) {
      // Already moved in handleDragOver, just ensure final state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === active.id ? { ...p, columnId: overColumnId } : p
        )
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            posts={posts.filter((p) => p.columnId === column.id)}
          />
        ))}
      </div>

      {/* Drag overlay — shows a ghost of the card being dragged */}
      <DragOverlay>
        {activePost ? (
          <div className="w-[320px] opacity-90">
            <PostCard post={activePost} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
