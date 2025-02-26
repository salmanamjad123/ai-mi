"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Users, MessageSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ChatMetrics {
  totalSessions: number;
  averageDuration: number;
  totalUsers: number;
  responseRate: number;
  sessionsByDate: Array<{
    date: string;
    sessions: number;
  }>;
}

export default function ChatAnalytics() {
  console.log("Rendering ChatAnalytics component"); // Debug log
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  const { data: metrics, isLoading, error } = useQuery<ChatMetrics>({
    queryKey: ["/api/analytics/chat", timeRange],
    queryFn: async () => {
      console.log("Fetching analytics data for timeRange:", timeRange); // Debug log
      const response = await fetch(`/api/analytics/chat?timeRange=${timeRange}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText); // Debug log
        throw new Error(`Failed to fetch chat analytics: ${errorText}`);
      }
      const data = await response.json();
      console.log("Received analytics data:", data); // Debug log
      return data;
    }
  });

  if (error) {
    console.error("Query error:", error); // Debug log
    return (
      <div className="p-4 text-red-500">
        Error loading analytics: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Chat Analytics</h2>
        <Select
          value={timeRange}
          onValueChange={(value: "day" | "week" | "month") => setTimeRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageDuration ? `${Math.round(metrics.averageDuration)}s` : '0s'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.responseRate ? `${Math.round(metrics.responseRate * 100)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat Sessions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {metrics?.sessionsByDate && metrics.sessionsByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.sessionsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), "PPP")}
                    formatter={(value: number) => [value, "Sessions"]}
                  />
                  <Bar dataKey="sessions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}