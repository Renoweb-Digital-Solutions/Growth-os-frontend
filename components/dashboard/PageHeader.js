"use client";

// Reason: Generic page header component reused across all dashboard pages.
// How: Renders a title, subtitle, and a children slot for page-specific actions
//      (filters, buttons, etc.) in a consistent layout.
// Receives: `title` (string), `subtitle` (string), `children` (ReactNode, optional right-side actions)
// Passes: nothing

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-[14px] text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  );
}
