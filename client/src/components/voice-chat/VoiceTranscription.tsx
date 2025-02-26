"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceTranscriptionProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function VoiceTranscription({ onTranscriptionComplete }: VoiceTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/transcription`;
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      // Create WebSocket connection using utility
      const ws = createWebSocketConnection('/ws/transcription', token);
      
      // Handle WebSocket messages
      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          setTranscript(data.text);
          if (data.isFinal) {
            onTranscriptionComplete(data.text);
          }
        } else if (data.type === 'error') {
          toast({
            title: "Transcription Error",
            description: data.error,
            variant: "destructive"
          });
        }
      });

      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          // Convert blob to raw PCM data
          const arrayBuffer = await event.data.arrayBuffer();
          ws.send(arrayBuffer);
        }
      };

      // Start recording
      recorder.start(1000); // Send chunks every second
      setIsRecording(true);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone or start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    setIsRecording(false);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
        {transcript && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Transcript:</p>
            <p className="mt-1">{transcript}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
