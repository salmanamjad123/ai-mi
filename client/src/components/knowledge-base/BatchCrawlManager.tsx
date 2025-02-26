"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Trash } from "lucide-react";
import { format } from "date-fns";

interface URL {
  url: string;
  depth?: number;
  maxPages?: number;
}

interface BatchCrawlManagerProps {
  agentId: number;
  userId: number;
}

export default function BatchCrawlManager({ agentId, userId }: BatchCrawlManagerProps) {
  const { toast } = useToast();
  const [urls, setUrls] = useState<URL[]>([{ url: "" }]);
  const [recurrence, setRecurrence] = useState<string>("once");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // Query to fetch existing crawls
  const { data: crawls = [], isLoading: isLoadingCrawls } = useQuery({
    queryKey: ["/api/crawl", agentId],
  });

  // Mutation for creating batch crawl
  const createBatchCrawlMutation = useMutation({
    mutationFn: async () => {
      const batchId = Date.now().toString();
      const promises = urls.map(url =>
        apiRequest("POST", "/api/crawl", {
          url: url.url,
          agentId,
          userId,
          batchId,
          scheduleRecurrence: recurrence,
          scheduledAt: scheduledAt || null,
          crawlConfig: {
            depth: url.depth || 2,
            maxPages: url.maxPages || 10,
            selector: "article, p, h1, h2, h3, h4, h5, h6"
          }
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Batch Crawl Scheduled",
        description: "Your websites have been scheduled for crawling."
      });
      setUrls([{ url: "" }]);
      setRecurrence("once");
      setScheduledAt("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to schedule crawls: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const addUrl = () => {
    setUrls([...urls, { url: "" }]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, field: keyof URL, value: string | number) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setUrls(newUrls);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Website Crawl</CardTitle>
          <CardDescription>
            Add multiple URLs to crawl and configure scheduling options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Website URL {index + 1}</Label>
                  <Input
                    value={url.url}
                    onChange={(e) => updateUrl(index, "url", e.target.value)}
                    placeholder="https://example.com"
                  />
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <Label>Depth</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={url.depth || 2}
                        onChange={(e) => updateUrl(index, "depth", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="w-1/2">
                      <Label>Max Pages</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={url.maxPages || 10}
                        onChange={(e) => updateUrl(index, "maxPages", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                {urls.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrl(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button onClick={addUrl} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another URL
            </Button>

            <div className="space-y-4 mt-6">
              <div>
                <Label>Schedule Type</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => createBatchCrawlMutation.mutate()}
              disabled={createBatchCrawlMutation.isPending || urls.some(u => !u.url)}
              className="w-full"
            >
              {createBatchCrawlMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling Crawls...
                </>
              ) : (
                'Schedule Batch Crawl'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Crawls */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Crawls</CardTitle>
          <CardDescription>
            View and manage your scheduled website crawls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCrawls ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : crawls.length > 0 ? (
            <div className="space-y-4">
              {crawls.map((crawl: any) => (
                <div
                  key={crawl.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{crawl.url}</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {crawl.status}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {crawl.scheduledAt && (
                        <p>Scheduled: {format(new Date(crawl.scheduledAt), "PPp")}</p>
                      )}
                      {crawl.lastRunAt && (
                        <p>Last Run: {format(new Date(crawl.lastRunAt), "PPp")}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No scheduled crawls found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
