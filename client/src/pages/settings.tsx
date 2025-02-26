"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import ApiConfigurationList from "@/components/settings/ApiConfigurationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Webhook, User } from "lucide-react";
import ProfileForm from "@/components/settings/ProfileForm";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-4 w-full">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-muted-foreground">Manage your account and integrations</p>
          </div>

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                API Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Configurations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ApiConfigurationList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}