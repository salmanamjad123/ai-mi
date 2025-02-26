"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPhoneNumberSchema, type InsertPhoneNumber } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function ImportPhoneNumberDialog() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<InsertPhoneNumber>({
    resolver: zodResolver(insertPhoneNumberSchema),
    defaultValues: {
      label: "",
      phoneNumber: "",
      twilioSid: "",
      twilioToken: "",
      isActive: true,
      userId: user?.id,
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: InsertPhoneNumber) => {
      const res = await apiRequest("POST", "/api/phone-numbers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
      toast({
        title: "Success",
        description: "Phone number imported successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPhoneNumber) => {
    importMutation.mutate(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Import phone number from Twilio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import from Twilio</DialogTitle>
          <DialogDescription>
            Import your Twilio phone number and configure it to work with your AI agents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Easy to identify name for the phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twilio Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twilioSid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twilio SID</FormLabel>
                  <FormControl>
                    <Input placeholder="AC..." {...field} />
                  </FormControl>
                  <FormDescription>
                    You can find this in your Twilio Console
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twilioToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twilio Auth Token</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Available in your Twilio Console
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={importMutation.isPending}>
              {importMutation.isPending ? "Importing..." : "Import phone number"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
