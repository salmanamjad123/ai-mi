"use client";

import { useState } from "react";
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
import { insertAgentSchema, type InsertAgent } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext"; 

const templates = [
  {
    id: "blank",
    name: "Blank template",
    description: "Start with a blank template and customize your agent to suit your needs.",
    icon: "👤"
  },
  {
    id: "support",
    name: "Support agent",
    description: "Talk to Eric, a dedicated support agent who is always ready to resolve any issues.",
    icon: "👨‍💼"
  },
  {
    id: "math",
    name: "Math tutor",
    description: "Speak with Matilda, a mathematics tutor who can help you with your studies.",
    icon: "👩‍🏫"
  },
  {
    id: "game",
    name: "Video game character",
    description: "Speak with a mysterious wizard who offers ancient wisdom to aid you on your journey.",
    icon: "🧙‍♂️"
  }
];

export default function CreateAgentDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { user } = useAuth(); 

  const form = useForm<InsertAgent>({
    resolver: zodResolver(insertAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "blank",
      isActive: true,
      userId: user?.id || 0 
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAgent) => {
      try {
        if (!user?.id) {
          throw new Error("You must be logged in to create an agent");
        }

        const agentData = {
          ...data,
          userId: user.id 
        };

        console.log("Submitting agent data:", agentData);
        const res = await apiRequest("POST", "/api/agents", agentData);
        console.log("Response status:", res.status);

        if (!res.ok) {
          const error = await res.json();
          console.error("Server error:", error);
          throw new Error(error.message || "Failed to create agent");
        }

        return res.json();
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents?userId=${user?.id}`] }); 
      toast({
        title: "Success",
        description: "Agent created successfully",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      console.error("Mutation error handler:", error);
      toast({
        title: "Error creating agent",
        description: error.message || "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: InsertAgent) {
    console.log("Form submitted with data:", data);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create an AI agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create an AI agent</DialogTitle>
          <DialogDescription>
            Choose a template or start from scratch to create your AI voice agent.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Agent name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {templates.map((template) => (
                        <FormItem key={template.id}>
                          <FormControl>
                            <RadioGroupItem
                              value={template.id}
                              id={template.id}
                              className="peer sr-only"
                            />
                          </FormControl>
                          <label
                            htmlFor={template.id}
                            className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{template.icon}</span>
                              <div className="font-semibold">{template.name}</div>
                            </div>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this agent does..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what this agent does.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create agent"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}