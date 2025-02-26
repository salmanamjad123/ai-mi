"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWebsiteCrawlSchema, type InsertWebsiteCrawl } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function CrawlWebsiteDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<InsertWebsiteCrawl>({
    resolver: zodResolver(insertWebsiteCrawlSchema),
    defaultValues: {
      url: "",
      status: "pending",
      userId: user?.id
    }
  });

  const crawlMutation = useMutation({
    mutationFn: async (data: InsertWebsiteCrawl) => {
      if (!user) {
        throw new Error("You must be logged in to crawl websites");
      }

      const crawlData = {
        ...data,
        userId: user.id || 1 // Ensure we pass the user ID
      };

      console.log("Submitting crawl request:", crawlData);
      const response = await apiRequest("POST", "/api/crawl", crawlData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start crawling");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crawl"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-documents"] });
      toast({
        title: "Success",
        description: "Website crawling started successfully",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error("Crawl error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start crawling. Please try again.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: InsertWebsiteCrawl) {
    try {
      await crawlMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }

  // Only render if we have a user
  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Globe className="mr-2 h-4 w-4" />
          Crawl Website
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create knowledge base document</DialogTitle>
          <DialogDescription>
            Upload files that will be passed to the LLM alongside the prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-2 mb-4">
          <Button variant="outline" className="flex-1" disabled>File</Button>
          <Button variant="secondary" className="flex-1">URL</Button>
          <Button variant="outline" className="flex-1" disabled>Text</Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a website URL to crawl and add to the knowledge base
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={crawlMutation.isPending}
            >
              Start crawling
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}