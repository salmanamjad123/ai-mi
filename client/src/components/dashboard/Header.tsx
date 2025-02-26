"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Headphones } from "lucide-react";

export default function Header() {
  return (
    <div className="flex items-center justify-between w-full border-b border-border bg-background">
      <div className="flex items-center space-x-4 px-4 py-4">
        <span className="text-sm font-medium">Active calls: 0</span>
      </div>

      <div className="flex items-center space-x-4 px-4 py-4">
        <div className="flex items-center space-x-2">
          <Headphones className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">Audio Tools</span>
        </div>

        <Bell className="w-5 h-5 text-muted-foreground" />

        <Select defaultValue="all-agents">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-agents">All agents</SelectItem>
            <SelectItem value="active">Active agents</SelectItem>
            <SelectItem value="inactive">Inactive agents</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="last-month">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-month">Last month</SelectItem>
            <SelectItem value="last-week">Last week</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}