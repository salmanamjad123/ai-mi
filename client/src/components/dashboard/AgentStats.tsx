"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const agents = [
  {
    name: "Support agent",
    calls: 38,
    minutes: 63,
    credits: 54862,
  },
  {
    name: "The HR Source",
    calls: 5,
    minutes: 5,
    credits: 933,
  },
  {
    name: "Jeff",
    calls: 4,
    minutes: 2,
    credits: 540,
  },
  {
    name: "Dennis",
    calls: 2,
    minutes: 3,
    credits: 1225,
  },
];

export default function AgentStats() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Most called agents</CardTitle>
        <Button variant="link" className="text-accent">
          See all 7 agents
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{agent.name}</p>
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <p>Number of calls: {agent.calls}</p>
                  <p>Call minutes: {agent.minutes}</p>
                </div>
              </div>
              <p className="text-sm font-medium">
                Credits spent: {agent.credits}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
