"use client";

import { cn } from "@/lib/utils";
import { Hash, Users, Settings, Book, Phone, History, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Hash },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Knowledge Base", href: "/knowledge-base", icon: Book },
  { name: "Phone Numbers", href: "/phone-numbers", icon: Phone },
  { name: "Call History", href: "/call-history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();

  return (
    <aside className="shrink-0 border-r border-border">
      <UISidebar collapsible="icon">
        <SidebarHeader className={cn(
          "flex items-center",
          state === "collapsed" ? "justify-center px-2" : "justify-between px-4"
        )}>
          <h2 className={cn(
            "text-lg font-semibold tracking-tight transition-opacity duration-200",
            state === "collapsed" && "opacity-0 w-0"
          )}>
            AI Voice Agent
          </h2>
          <SidebarTrigger className={cn(
            "h-4 w-4",
            state === "collapsed" && "-ml-3"
          )} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <SidebarMenuItem key={item.name}>
                  <div className={cn(
                    "flex items-center gap-3 min-w-0",
                    state === "collapsed" ? "justify-center" : "px-2"
                  )}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.href)}
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className={cn(
                        "transition-all duration-200",
                        state === "collapsed" && "w-0 opacity-0"
                      )}>
                        {item.name}
                      </span>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className={cn(
            "flex items-center gap-3 p-4",
            state === "collapsed" && "justify-center p-2"
          )}>
            <div className={cn(
              "flex-1 truncate transition-all duration-200",
              state === "collapsed" && "w-0 opacity-0"
            )}>
              <p className="text-sm font-medium text-sidebar-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </UISidebar>
    </aside>
  );
}