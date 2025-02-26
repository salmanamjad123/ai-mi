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
import { Mic, Square } from "lucide-react";
import { Agent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TestAgentDialogProps {
  agent: Agent;
}

type ChatStatus = "idle" | "recording" | "error";

export default function TestAgentDialog({ agent }: TestAgentDialogProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [isOpen, setIsOpen] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setChatStatus("recording");
      toast({
        title: "Recording Started",
        description: "You can now speak to the AI agent.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
      setChatStatus("error");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setChatStatus("idle");
  };

  const getStatusText = (status: ChatStatus) => {
    switch (status) {
      case "recording":
        return "Listening... Click the square to stop";
      case "error":
        return "Error occurred. Please try again";
      default:
        return "Click the microphone to start";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Test AI agent</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Test {agent.name}</DialogTitle>
          <DialogDescription>
            Have a voice conversation with your AI agent
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-pink-100 to-green-100">
            {!isRecording ? (
              <Button
                size="icon"
                variant="ghost"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full"
                onClick={startRecording}
                disabled={chatStatus === "error"}
              >
                <Mic className="w-8 h-8" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full"
                onClick={stopRecording}
              >
                <Square className="w-8 h-8" />
              </Button>
            )}
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {getStatusText(chatStatus)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}