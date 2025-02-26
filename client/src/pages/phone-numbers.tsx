"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { useQuery } from "@tanstack/react-query";
import type { PhoneNumber } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import ImportPhoneNumberDialog from "@/components/phone-numbers/ImportPhoneNumberDialog";

export default function PhoneNumbersPage() {
  const { user } = useAuth();

  const { data: phoneNumbers = [] } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/phone-numbers"],
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
              <h2 className="text-3xl font-bold">Phone Numbers</h2>
              <p className="text-muted-foreground">Manage your Twilio phone numbers</p>
            </div>
            <ImportPhoneNumberDialog />
          </div>

          {phoneNumbers.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Phone Numbers Yet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Import your first Twilio phone number to get started.
                </p>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {phoneNumbers.map((phoneNumber) => (
                <Card key={phoneNumber.id}>
                  <CardHeader>
                    <CardTitle>{phoneNumber.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{phoneNumber.phoneNumber}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        phoneNumber.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {phoneNumber.isActive ? 'Active' : 'Inactive'}
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