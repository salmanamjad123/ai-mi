"use client";

import { useQuery } from "@tanstack/react-query";
import { VoiceChatSession } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface VoiceChatHistoryProps {
  userId: number;
}

export default function VoiceChatHistory({ userId }: VoiceChatHistoryProps) {
  const { data: history, isLoading } = useQuery<VoiceChatSession[]>({
    queryKey: ["/api/voice-chat/history", userId],
    queryFn: async () => {
      const response = await fetch(`/api/voice-chat/history/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Voice Chat History</h2>
      {history?.map((session) => (
        <Card key={session.sessionId}>
          <CardHeader>
            <CardTitle className="text-sm">
              Chat Session - {format(new Date(session.startedAt), "PPP p")}
            </CardTitle>
            <CardDescription>
              Duration: {session.duration}s | Status: {session.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.transcription && (
              <div className="mb-4">
                <h4 className="text-sm font-medium">Your Message:</h4>
                <p className="text-sm text-muted-foreground">{session.transcription}</p>
              </div>
            )}
            {session.agentResponse && (
              <div>
                <h4 className="text-sm font-medium">AI Response:</h4>
                <p className="text-sm text-muted-foreground">{session.agentResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {history?.length === 0 && (
        <p className="text-center text-muted-foreground">No chat history available</p>
      )}
    </div>
  );
}
