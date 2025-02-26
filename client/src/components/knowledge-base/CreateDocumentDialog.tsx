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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertKnowledgeDocumentSchema, insertWebsiteCrawlSchema } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";

export default function CreateDocumentDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [textContent, setTextContent] = useState("");

  const crawlMutation = useMutation({
    mutationFn: async (url: string) => {
      const crawlData = {
        url,
        userId: user?.id,
        status: "pending",
        type: "website"
      };

      const validatedData = insertWebsiteCrawlSchema.parse(crawlData);
      const res = await apiRequest("POST", "/api/crawl", validatedData);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to start crawling");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-documents"] });
      toast({
        title: "Success",
        description: "Started crawling website. This may take a few minutes.",
      });
      setOpen(false);
      setUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Validate URL format
    try {
      new URL(url);
      await crawlMutation.mutateAsync(url);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TypeError") {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL including http:// or https://",
            variant: "destructive",
          });
        } else {
          console.error("Failed to crawl website:", error);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create knowledge base document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create knowledge base document</DialogTitle>
          <DialogDescription>
            Upload files that will be passed to the LLM alongside the prompt.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="grid w-full gap-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Upload files</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50">
                  <Input 
                    id="file" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf, .txt, .docx, .html, .epub"
                  />
                  <div className="text-center">
                    <p>Click or drag files to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum size: 21 MB<br />
                      Supported types: pdf, txt, docx, html, epub
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <form onSubmit={handleUrlSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input 
                  id="url" 
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter a website URL to crawl and add to the knowledge base
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full mt-4"
                disabled={crawlMutation.isPending || !url}
              >
                {crawlMutation.isPending ? "Starting crawl..." : "Start crawling"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Text content</Label>
              <Textarea 
                id="text" 
                placeholder="Enter your text here..."
                className="min-h-[200px]"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={crawlMutation.isPending}
          >
            Create document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}