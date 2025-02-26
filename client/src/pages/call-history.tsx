"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { useQuery } from "@tanstack/react-query";
import type { CallHistory } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CallHistoryPage() {
  const { user } = useAuth();

  const { data: calls = [] } = useQuery<CallHistory[]>({
    queryKey: ["/api/call-history"],
    enabled: !!user,
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Call History</h2>
              <p className="text-muted-foreground">View your agent conversation history</p>
            </div>
          </div>

          <div className="space-y-4">
            {calls.map((call) => (
              <Card key={call.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(new Date(call.startedAt), "PPp")}
                  </CardTitle>
                  <Badge variant={call.status === "success" ? "default" : "destructive"}>
                    {call.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Source</p>
                        <p className="text-sm text-muted-foreground capitalize">{call.source}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Recording</p>
                        <p className="text-sm text-muted-foreground">
                          {call.recordingEnabled ? (
                            call.recordingUrl ? (
                              <a href={call.recordingUrl} className="text-primary hover:underline">
                                Listen
                              </a>
                            ) : "Processing..."
                          ) : "Disabled"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Transcript</p>
                        <p className="text-sm text-muted-foreground">
                          {call.transcriptUrl && (
                            <a href={call.transcriptUrl} className="text-primary hover:underline">
                              View
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}