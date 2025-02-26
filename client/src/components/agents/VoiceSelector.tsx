"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
}

interface VoiceSelectorProps {
  value?: string;
  onChange: (voiceId: string) => void;
}

export default function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  console.log("VoiceSelector render - current value:", value); // Debug log
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const { data: voicesData, isLoading } = useQuery<{ voices: Voice[] }>({
    queryKey: ["/api/voices"],
    queryFn: async () => {
      console.log("Fetching voices data"); // Debug log
      const response = await fetch("/api/voices");
      if (!response.ok) {
        throw new Error("Failed to fetch voices");
      }
      const data = await response.json();
      console.log("Received voices data:", data); // Debug log
      return data;
    }
  });

  const playPreview = (previewUrl: string) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.remove();
    }
    const audio = new Audio(previewUrl);
    setPreviewAudio(audio);
    audio.play();
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading voices..." />
        </SelectTrigger>
      </Select>
    );
  }

  const voices = voicesData?.voices || [];
  const selectedVoice = voices.find((voice: Voice) => voice.id === value);

  console.log("Available voices:", voices); // Debug log
  console.log("Selected voice:", selectedVoice); // Debug log

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice: Voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name} ({voice.category})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVoice && selectedVoice.previewUrl && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => playPreview(selectedVoice.previewUrl)}
          title="Preview voice"
        >
          <Volume className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}