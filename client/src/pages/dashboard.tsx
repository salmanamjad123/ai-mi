"use client";

import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import StatCard from "@/components/dashboard/StatCard";
import TimeSeriesGraph from "@/components/dashboard/TimeSeriesGraph";
import AgentStats from "@/components/dashboard/AgentStats";
import LanguageDistribution from "@/components/dashboard/LanguageDistribution";
import { Clock, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-4 w-full">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">My Workspace</h2>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Number of calls"
              value="50"
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              title="Average duration"
              value="1:26"
            />
            <StatCard
              title="Total cost"
              value="57,882"
              suffix="credits"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="Average cost"
              value="1,158"
              suffix="credits/call"
            />
          </div>

          <div className="border rounded-lg p-4 mb-4 w-full">
            <TimeSeriesGraph />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
            <AgentStats />
            <LanguageDistribution />
          </div>
        </main>
      </div>
    </div>
  );
}