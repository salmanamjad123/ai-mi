import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AgentsPage from "@/pages/agents";
import AuthPage from "@/pages/auth";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import KnowledgeBasePage from "@/pages/knowledge-base";
import PhoneNumbersPage from "@/pages/phone-numbers";
import CallHistoryPage from "@/pages/call-history";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";
import { SidebarProvider } from "@/components/ui/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/agents" component={AgentsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/knowledge-base" component={KnowledgeBasePage} />
      <ProtectedRoute path="/phone-numbers" component={PhoneNumbersPage} />
      <ProtectedRoute path="/call-history" component={CallHistoryPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider defaultOpen>
          <Router />
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}