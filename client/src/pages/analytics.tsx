"use client";

import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import ChatAnalytics from "@/components/analytics/ChatAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-4 w-full">
          <ChatAnalytics />
        </main>
      </div>
    </div>
  );
}