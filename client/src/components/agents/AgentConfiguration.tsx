import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type Agent } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TestAgentDialog from "./TestAgentDialog";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import VoiceSelector from "./VoiceSelector";
import { useAuth } from '@/context/AuthContext';

interface Voice {
  id: string;
  name: string;
  category: string;
  description: string;
  previewUrl: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
  };
}

interface AgentConfigurationProps {
  agent: Agent;
}

export default function AgentConfiguration({ agent }: AgentConfigurationProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Add a check to prevent unauthorized access
  if (agent.userId !== user?.id) {
    return (
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view or modify this agent.</p>
      </div>
    );
  }

  const [selectedVoiceId, setSelectedVoiceId] = useState(agent.voiceId || '');
  const [stability, setStability] = useState(
    agent.voiceSettings?.stability
      ? agent.voiceSettings.stability * 100
      : 75
  );
  const [similarityBoost, setSimilarityBoost] = useState(
    agent.voiceSettings?.similarity_boost
      ? agent.voiceSettings.similarity_boost * 100
      : 75
  );
  const [name, setName] = useState(agent.name || '');
  const [description, setDescription] = useState(agent.description || '');
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt || '');
  const [isActive, setIsActive] = useState(agent.isActive);

  const { data: voicesResponse, isLoading: isLoadingVoices, error: voicesError } = useQuery<{ voices: Voice[], warning?: string, error?: string }>({
    queryKey: ["/api/voices"],
    retry: 3,
  });

  const queryClient = useQueryClient();

  console.log("Current agent voice ID:", agent.voiceId); // Debug log
  console.log("Selected voice ID state:", selectedVoiceId); // Debug log

  const updateVoiceMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      console.log("Updating voice with ID:", voiceId); // Debug log
      const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, {
        voiceId: voiceId
      });
      console.log("Voice update response:", response); // Debug log
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agent.id}`] });
      toast({
        title: "Success",
        description: "Voice updated successfully",
      });
    },
    onError: (error) => {
      console.error("Voice update error:", error); // Debug log
      toast({
        title: "Error",
        description: "Failed to update voice",
        variant: "destructive",
      });
      // Revert to previous voice ID on error
      setSelectedVoiceId(agent.voiceId || '');
    }
  });

  const updateVoiceSettingsMutation = useMutation({
    mutationFn: async ({ stability, similarityBoost }: { stability: number; similarityBoost: number }) => {
      return updateAgentMutation.mutateAsync({
        voiceSettings: {
          stability: stability / 100,
          similarity_boost: similarityBoost / 100
        }
      });
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      updateVoiceSettingsMutation.mutate({ stability, similarityBoost });
    }, 500);

    return () => clearTimeout(timer);
  }, [stability, similarityBoost, updateVoiceSettingsMutation]);

  const updateAgentMutation = useMutation({
    mutationFn: async (updates: Partial<Agent>) => {
      return apiRequest("PATCH", `/api/agents/${agent.id}`, updates);
    }
  });

  const handleBasicSettingsChange = () => {
    updateAgentMutation.mutate({
      name,
      description,
      systemPrompt: systemPrompt || null
    });
  };

  useEffect(() => {
    if (voicesResponse?.warning) {
      toast({
        title: "Voice Service Notice",
        description: voicesResponse.warning,
      });
    }
    if (voicesResponse?.error) {
      toast({
        title: "Voice Service Error",
        description: voicesResponse.error,
        variant: "destructive"
      });
    }
  }, [voicesResponse?.warning, voicesResponse?.error, toast]);

  const handleVoiceChange = (voiceId: string) => {
    console.log("Voice selection changed to:", voiceId); // Debug log
    setSelectedVoiceId(voiceId);
    updateVoiceMutation.mutate(voiceId);
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{agent.name}</h2>
          <p className="text-sm text-muted-foreground">Configure your AI agent settings</p>
        </div>
        <TestAgentDialog agent={agent} />
      </div>

      <Tabs defaultValue="voice" className="space-y-4">
        <TabsList>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="voice">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Selection</CardTitle>
                <CardDescription>
                  Choose the ElevenLabs voice for your agent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voicesError ? (
                  <div className="text-red-500">Error loading voices. Please try again.</div>
                ) : (
                  <VoiceSelector
                    value={selectedVoiceId}
                    onChange={handleVoiceChange}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice Stability</CardTitle>
                <CardDescription>
                  Higher values make speech more consistent but potentially monotone. Lower values increase expressiveness but may introduce instabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={[stability]}
                    max={100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => setStability(value[0])}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>More expressive</span>
                    <span>More stable</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clarity + Similarity Enhancement</CardTitle>
                <CardDescription>
                  Higher values enhance clarity and make speech more similar to the original voice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={[similarityBoost]}
                    max={100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => setSimilarityBoost(value[0])}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>More natural</span>
                    <span>More similar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Configure the basic properties of your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleBasicSettingsChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleBasicSettingsChange}
                />
              </div>
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  onBlur={handleBasicSettingsChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setIsActive(checked);
                    updateAgentMutation.mutate({ isActive: checked });
                  }}
                />
                <Label>Active</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analysis">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation criteria</CardTitle>
                <CardDescription>
                  Define custom criteria to evaluate conversations against. You can find the evaluation results for each conversation in the history tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Create custom evaluation criteria
                </div>
                <Button variant="outline">Add criteria</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data collection</CardTitle>
                <CardDescription>
                  Define custom data specifications to extract from conversation transcripts. You can find the evaluation results for each conversation in the history tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Configure data extraction
                </div>
                <Button variant="outline">Add item</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="security">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enable authentication</CardTitle>
                <CardDescription>
                  Require users to authenticate before connecting to the agent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Switch />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allowlist</CardTitle>
                <CardDescription>
                  Specify the hosts that will be allowed to connect to this agent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">No allowlist specified. Any host will be able to connect to this agent.</p>
                  <Button variant="outline">Add host</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enable overrides</CardTitle>
                <CardDescription>
                  Choose which parts of the config can be overridden by the client at the start of the conversation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-language">Agent language</Label>
                  <Switch id="agent-language" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="first-message">First message</Label>
                  <Switch id="first-message" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-prompt">System prompt</Label>
                  <Switch id="system-prompt" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice">Voice</Label>
                  <Switch id="voice" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="widget">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Embed code</CardTitle>
                <CardDescription>
                  Copy the code snippet to the pages where you want the conversation widget to be displayed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input readOnly value={`<script src="agent-id/${agent.id}/elevenlabs-client.min.js"></script>`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shareable Page</CardTitle>
                <CardDescription>
                  This is your public page where people can test your shareable link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input value={`https://elevenlabs.io/share/${agent.id}`} readOnly />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}