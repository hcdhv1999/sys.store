"use client";

import { useState } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryProvider>
      <div className="min-h-dvh">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ps-64">
          <Topbar onMenu={() => setSidebarOpen(true)} />
          <main className="mx-auto max-w-[1440px] p-4 pb-16 lg:p-6">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
