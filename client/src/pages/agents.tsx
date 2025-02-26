"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { useQuery } from "@tanstack/react-query";
import type { Agent } from "@shared/schema";
import CreateAgentDialog from "@/components/agents/CreateAgentDialog";
import AgentConfiguration from "@/components/agents/AgentConfiguration";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AgentsPage() {
  const { user } = useAuth();
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: [`/api/agents?userId=${user?.id}`], // Add userId to query
    enabled: !!user?.id, // Only fetch when we have a user ID
  });

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Reset selectedAgent if it doesn't belong to current user
  useEffect(() => {
    if (selectedAgent && selectedAgent.userId !== user?.id) {
      setSelectedAgent(null);
    }
  }, [user, selectedAgent]);

  if (selectedAgent) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full">
          <Header />
          <main className="flex-1 p-4 w-full">
            <AgentConfiguration agent={selectedAgent} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">AI Agents</h2>
              <p className="text-muted-foreground">Manage your AI voice agents</p>
            </div>
            <CreateAgentDialog />
          </div>

          {agents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No AI Agents Yet</CardTitle>
                <CardDescription>
                  Create your first AI agent to get started with voice interactions.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                  <CardHeader>
                    <CardTitle>{agent.name}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Button variant="ghost" size="sm">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}