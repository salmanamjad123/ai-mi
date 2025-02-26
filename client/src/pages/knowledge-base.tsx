import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import CreateDocumentDialog from "@/components/knowledge-base/CreateDocumentDialog";
import CrawlWebsiteDialog from "@/components/knowledge-base/CrawlWebsiteDialog";
import type { KnowledgeDocument, WebsiteCrawl } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { MoreHorizontal, FileText, Link2 } from "lucide-react";

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [] } = useQuery<KnowledgeDocument[]>({
    queryKey: ["/api/knowledge-documents"],
    enabled: !!user?.id,
  });

  const { data: crawls = [] } = useQuery<WebsiteCrawl[]>({
    queryKey: ["/api/crawl"],
    enabled: !!user?.id,
  });

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
              <p className="text-sm text-muted-foreground">
                Manage your training data and knowledge sources
              </p>
            </div>
            <div className="flex gap-2">
              <CrawlWebsiteDialog />
              <CreateDocumentDialog />
            </div>
          </div>

          <div className="w-full mb-4">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {crawls.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Active Crawls</h2>
              <div className="space-y-3">
                {crawls.filter(crawl => crawl.status === "pending" || crawl.status === "processing").map((crawl) => (
                  <Card key={crawl.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{crawl.url}</CardTitle>
                        <CardDescription>{crawl.status}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-sm text-muted-foreground">Processing</span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:bg-accent/5 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-4">
                    {doc.type === 'website' ? (
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                      <CardTitle className="text-base">{doc.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Used by {doc.agentId ? 'AI Agent' : 'The HR Source'}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">{doc.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}