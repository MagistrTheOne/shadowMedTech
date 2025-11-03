"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardNav() {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-neutral-950/40 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-4">
        <SidebarTrigger className="text-white" />
        <div className="flex-1" />
        {/* Additional header content can go here */}
      </div>
    </header>
  );
}
