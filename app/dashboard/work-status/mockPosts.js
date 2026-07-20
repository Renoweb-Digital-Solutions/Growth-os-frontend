// ============================================================================
// Mock data for Work Status (Kanban) page
// 10 sample social media posts distributed across 3 columns.
// Each post has platform, content type, assignee, due date, priority, etc.
// ============================================================================

// TODO: replace with CRM/Project management API (e.g. internal task API, Asana, Monday.com)
// How: Fetch task/content items from backend, mapping to { id, title, platform, ... } shape.

export const columns = [
  { id: "todo", title: "To Do", color: "#94A3B8", dotColor: "bg-slate-400" },
  { id: "in-progress", title: "In Progress", color: "#6366F1", dotColor: "bg-indigo-500" },
  { id: "done", title: "Done", color: "#22C55E", dotColor: "bg-green-500" },
];

export const platforms = {
  instagram: { name: "Instagram", color: "#E1306C", bg: "bg-pink-50", text: "text-pink-700" },
  linkedin: { name: "LinkedIn", color: "#0A66C2", bg: "bg-blue-50", text: "text-blue-700" },
  facebook: { name: "Facebook", color: "#1877F2", bg: "bg-blue-50", text: "text-blue-700" },
  tiktok: { name: "TikTok", color: "#000000", bg: "bg-slate-100", text: "text-slate-800" },
  youtube: { name: "YouTube", color: "#FF0000", bg: "bg-red-50", text: "text-red-700" },
};

export const contentTypes = ["Reel", "Carousel", "Story", "Blog", "Ad Creative"];

export const assignees = [
  { id: "a1", name: "Samar", initials: "SA", color: "#8B5CF6" },
  { id: "a2", name: "Lusi", initials: "LU", color: "#3B82F6" },
  { id: "a3", name: "Alex", initials: "AL", color: "#EC4899" },
  { id: "a4", name: "Maria", initials: "MA", color: "#10B981" },
];

export const initialPosts = [
  {
    id: "post-1",
    title: "Summer Collection Launch — Behind the Scenes",
    platform: "instagram",
    contentType: "Reel",
    assignee: "a1",
    dueDate: "2026-07-22",
    priority: "high",
    columnId: "todo",
  },
  {
    id: "post-2",
    title: "5 Tips for Scaling Your E-commerce Brand",
    platform: "linkedin",
    contentType: "Carousel",
    assignee: "a2",
    dueDate: "2026-07-24",
    priority: "medium",
    columnId: "todo",
  },
  {
    id: "post-3",
    title: "Customer Spotlight: How Nexus Grew 300%",
    platform: "facebook",
    contentType: "Blog",
    assignee: "a3",
    dueDate: "2026-07-25",
    priority: "low",
    columnId: "todo",
  },
  {
    id: "post-4",
    title: "Product Demo — New Dashboard Features",
    platform: "youtube",
    contentType: "Reel",
    assignee: "a1",
    dueDate: "2026-07-21",
    priority: "high",
    columnId: "in-progress",
  },
  {
    id: "post-5",
    title: "Quick Tip: UTM Tagging Best Practices",
    platform: "tiktok",
    contentType: "Story",
    assignee: "a4",
    dueDate: "2026-07-23",
    priority: "medium",
    columnId: "in-progress",
  },
  {
    id: "post-6",
    title: "Weekly Growth Metrics Recap",
    platform: "instagram",
    contentType: "Carousel",
    assignee: "a2",
    dueDate: "2026-07-20",
    priority: "medium",
    columnId: "in-progress",
  },
  {
    id: "post-7",
    title: "Client Testimonial — Marvel Agency",
    platform: "linkedin",
    contentType: "Ad Creative",
    assignee: "a3",
    dueDate: "2026-07-18",
    priority: "low",
    columnId: "done",
  },
  {
    id: "post-8",
    title: "Q2 Results Infographic",
    platform: "instagram",
    contentType: "Carousel",
    assignee: "a1",
    dueDate: "2026-07-15",
    priority: "high",
    columnId: "done",
  },
  {
    id: "post-9",
    title: "Brand Story — Our Journey So Far",
    platform: "youtube",
    contentType: "Reel",
    assignee: "a4",
    dueDate: "2026-07-17",
    priority: "medium",
    columnId: "done",
  },
  {
    id: "post-10",
    title: "Flash Sale Announcement — 48hr Deal",
    platform: "facebook",
    contentType: "Ad Creative",
    assignee: "a2",
    dueDate: "2026-07-26",
    priority: "high",
    columnId: "todo",
  },
];
