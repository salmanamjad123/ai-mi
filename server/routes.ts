import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { insertAgentSchema, insertWebsiteCrawlSchema } from "@shared/schema";
import OpenAI from 'openai';
import crypto from 'crypto';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server first
  const httpServer = createServer(app);

  // Initialize WebSocket server with the HTTP server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/transcription'
  });

  // Keep track of conversation contexts
  const conversationContexts = new Map<string, Array<{role: string, content: string}>>();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established for transcription');
    let currentSessionId: string | null = null;

    // Extract session ID from URL path
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const urlParts = url.pathname.split('/');
    currentSessionId = urlParts[urlParts.length - 1]; // Get session ID from path

    if (!currentSessionId) {
      console.error('No session ID provided');
      ws.close(1008, 'Session ID required');
      return;
    }

    ws.on('message', async (message: Buffer) => {
      try {
        console.log('Received audio chunk, size:', message.length, 'bytes');

        // Extract query parameters for Deepgram
        const encoding = 'webm';
        const mimetype = 'audio/webm;codecs=opus';
        const sampleRate = '48000';

        console.log('Deepgram request parameters:', {
          encoding,
          mimetype,
          sampleRate,
          messageSize: message.length
        });

        // Send audio chunk to Deepgram for real-time transcription
        const deepgramUrl = `https://api.deepgram.com/v1/listen?encoding=${encoding}&language=en-US&punctuate=true&interim_results=true`;
        console.log('Sending request to Deepgram:', deepgramUrl);

        const response = await fetch(deepgramUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': mimetype,
          },
          body: message
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Deepgram API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          throw new Error(`Deepgram API error: ${response.statusText}`);
        }

        const transcriptionData = await response.json();
        console.log('Deepgram response:', transcriptionData);

        const transcript = transcriptionData.results?.channels[0]?.alternatives[0]?.transcript;

        if (transcript && transcript.trim()) {
          // Send transcription back to client
          ws.send(JSON.stringify({
            type: 'transcription',
            text: transcript,
            isFinal: transcriptionData.is_final || false
          }));

          // If transcription is final, generate AI response
          if (transcriptionData.is_final) {
            // Get the session information
            const session = await storage.getVoiceChatSession(currentSessionId);
            if (!session) {
              throw new Error('Session not found');
            }

            const agent = await storage.getAgent(session.agent_id);
            if (!agent) {
              throw new Error('Agent not found');
            }

            // Use OpenAI for response generation
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_SECRET
            });

            // Get conversation context
            const messages = conversationContexts.get(currentSessionId) || [
              {
                role: "system",
                content: "You are a helpful AI assistant engaged in a voice conversation. Keep responses concise and natural."
              }
            ];

            // Add user message to context
            messages.push({ role: "user", content: transcript });

            const completion = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: messages,
            });

            const aiText = completion.choices[0].message.content;
            if (!aiText) {
              throw new Error('No AI response generated');
            }

            // Add AI response to context
            messages.push({ role: "assistant", content: aiText });
            conversationContexts.set(currentSessionId, messages);

            // Send text response to client
            ws.send(JSON.stringify({
              type: 'response',
              text: aiText
            }));

            // Convert AI response to speech using Eleven Labs
            if (!agent.voiceId) {
              throw new Error('No voice selected for agent');
            }

            console.log("Converting to speech with ElevenLabs using voice ID:", agent.voiceId);
            const synthesisResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${agent.voiceId}`, {
              method: 'POST',
              headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: aiText,
                model_id: 'eleven_monolingual_v1',
                voice_settings: agent.voiceSettings || {
                  stability: 0.75,
                  similarity_boost: 0.75
                }
              })
            });

            if (!synthesisResponse.ok) {
              const errorText = await synthesisResponse.text();
              console.error("ElevenLabs synthesis error:", {
                status: synthesisResponse.status,
                text: errorText
              });
              throw new Error('Failed to synthesize speech');
            }

            const audioBuffer = await synthesisResponse.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString('base64');

            console.log("Audio synthesis successful, sending to client");
            ws.send(JSON.stringify({
              type: 'audio',
              audio: audioBase64
            }));

            // Update session with latest interaction
            await storage.updateVoiceChatSession(currentSessionId, {
              transcription: transcript,
              agent_response: aiText
            });
          }
        } else {
          console.log('No transcription in response:', transcriptionData);
        }
      } catch (error) {
        console.error('Error processing audio:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Processing failed'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (currentSessionId) {
        storage.updateVoiceChatSession(currentSessionId, {
          status: "completed",
          ended_at: new Date()
        }).catch(console.error);

        conversationContexts.delete(currentSessionId);
      }
    });
  });

  // Voice chat session creation
  app.post("/api/voice-chat", async (req: Request, res: Response) => {
    try {
      console.log("Creating new voice chat session:", req.body);
      const sessionId = crypto.randomUUID();

      const session = await storage.createVoiceChatSession({
        session_id: sessionId,
        user_id: req.body.userId,
        agent_id: req.body.agentId,
        status: "active",
        started_at: new Date(),
        ended_at: null,
        transcription: null,
        agent_response: null,
        metadata: {
          userAgent: req.headers['user-agent'],
          createdAt: new Date().toISOString(),
          voiceId: req.body.voiceId 
        }
      });

      if (!session) {
        throw new Error("Failed to create session");
      }

      // Initialize conversation context for this session
      conversationContexts.set(sessionId, [
        {
          role: "system",
          content: "You are a helpful AI assistant engaged in a voice conversation. Keep responses concise and natural."
        }
      ]);

      console.log("Created voice chat session:", session);
      res.status(201).json({ sessionId });
    } catch (error) {
      console.error("Error creating voice chat session:", error);
      res.status(400).json({ 
        error: "Failed to create session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Agent routes
  app.get("/api/agents", async (_req: Request, res: Response) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.post("/api/agents", async (req: Request, res: Response) => {
    try {
      console.log("Received agent creation request:", req.body);
      const validatedData = insertAgentSchema.parse(req.body);
      console.log("Validated agent data:", validatedData);

      const agent = await storage.createAgent({
        ...validatedData,
        type: validatedData.type || 'ai',
        isActive: validatedData.isActive ?? true,
        voiceId: validatedData.voiceId || null,
        systemPrompt: validatedData.systemPrompt || null,
        voiceSettings: validatedData.voiceSettings || {
          stability: 0.75,
          similarity_boost: 0.75
        }
      });
      console.log("Created agent:", agent);

      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid agent data",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.get("/api/agents/:id", async (req: Request, res: Response) => {
    const agent = await storage.getAgent(Number(req.params.id));
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    res.json(agent);
  });

  app.patch("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const agent = await storage.getAgent(Number(req.params.id));
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }

      const updatedAgent = await storage.updateAgent(Number(req.params.id), {
        ...agent,
        ...req.body
      });

      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  // Website crawling routes
  app.post("/api/crawl", async (req: Request, res: Response) => {
    try {
      console.log("Received crawl request with data:", req.body);
      const crawlData = insertWebsiteCrawlSchema.parse(req.body);

      // Verify user exists before creating crawl
      if (!crawlData.userId) {
        console.error('No user ID provided in request');
        return res.status(400).json({ error: "User ID is required" });
      }

      const userExists = await storage.getUser(Number(crawlData.userId));
      if (!userExists) {
        console.error(`User with ID ${crawlData.userId} not found`);
        return res.status(400).json({ 
          error: "Invalid user ID",
          details: "User not found in database"
        });
      }

      console.log("Creating crawl for user:", userExists.id);

      // First create a crawl record with pending status
      const crawl = await storage.createWebsiteCrawl({
        url: crawlData.url,
        status: "pending",
        userId: userExists.id,
        agentId: crawlData.agentId || null,
        scheduledAt: crawlData.scheduledAt,
        scheduleRecurrence: crawlData.scheduleRecurrence
      });

      try {
        // Call Firecrawl API with proper error handling
        const firecrawlUrl = "https://api.firecrawl.io/v1/crawl";
        console.log("Calling Firecrawl API:", firecrawlUrl, "for URL:", crawlData.url);

        const firecrawlResponse = await fetch(firecrawlUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            "Accept": "application/json"
          },
          body: JSON.stringify({
            url: crawlData.url,
            depth: crawlData.crawlConfig?.depth || 2,
            maxPages: crawlData.crawlConfig?.maxPages || 10,
            selector: crawlData.crawlConfig?.selector || "article, p, h1, h2, h3, h4, h5, h6",
            filters: crawlData.crawlConfig?.filters || []
          })
        });

        console.log("Firecrawl API response status:", firecrawlResponse.status);

        if (!firecrawlResponse.ok) {
          const errorText = await firecrawlResponse.text();
          console.error("Firecrawl API error:", {
            status: firecrawlResponse.status,
            statusText: firecrawlResponse.statusText,
            error: errorText
          });
          throw new Error(`Firecrawl API error: ${errorText}`);
        }

        const firecrawlData = await firecrawlResponse.json();
        console.log("Firecrawl API response data:", firecrawlData);

        if (!firecrawlData.content) {
          throw new Error("No content returned from Firecrawl API");
        }

        // Create a knowledge document from the crawled content
        const knowledgeDoc = await storage.createKnowledgeDocument({
          name: `Crawled: ${crawlData.url}`,
          type: "website",
          source: crawlData.url,
          content: firecrawlData.content,
          metadata: {
            crawledAt: new Date().toISOString(),
            pageCount: firecrawlData.pageCount || 1,
            crawlStats: firecrawlData.stats || {}
          },
          agentId: crawlData.agentId
        });

        // Update crawl status to completed
        await storage.updateWebsiteCrawl(crawl.id, {
          status: "completed",
          lastRunAt: new Date()
        });

        res.status(201).json({ crawl, document: knowledgeDoc });
      } catch (error) {
        console.error("Error during crawl process:", error);

        // Update crawl status to failed
        await storage.updateWebsiteCrawl(crawl.id, {
          status: "failed"
        });

        // Send a more detailed error response
        res.status(400).json({
          error: "Failed to crawl website",
          details: error instanceof Error ? error.message : "Unknown error occurred",
          crawlId: crawl.id
        });
        return;
      }
    } catch (error) {
      console.error("Crawl error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to crawl website",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Get crawls for an agent
  app.get("/api/crawl/:agentId", async (req: Request, res: Response) => {
    try {
      const agentId = Number(req.params.agentId);
      const crawls = await storage.getWebsiteCrawls(agentId);

      // Sort by scheduled date, with pending/scheduled first
      crawls.sort((a, b) => {
        // First sort by status (pending/scheduled first)
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        // Then sort by scheduled date
        const dateA = a.scheduledAt || a.createdAt;
        const dateB = b.scheduledAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      res.json(crawls);
    } catch (error) {
      console.error("Error fetching crawls:", error);
      res.status(500).json({ error: "Failed to fetch crawls" });
    }
  });

  app.get("/api/crawl/:id", async (req: Request, res: Response) => {
    try {
      const crawl = await storage.getWebsiteCrawl(Number(req.params.id));
      if (!crawl) {
        res.status(404).json({ error: "Crawl not found" });
        return;
      }
      res.json(crawl);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crawl data" });
    }
  });

  // Knowledge document routes
  app.get("/api/knowledge-documents", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getKnowledgeDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge documents" });
    }
  });

  // Add ElevenLabs API route with proper implementation
  app.get("/api/voices", async (_req: Request, res: Response) => {
    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        console.warn('ELEVENLABS_API_KEY environment variable is not set');
        return res.json({
          voices: [],
          warning: 'Voice selection is currently unavailable. Please configure ElevenLabs API key.'
        });
      }

      console.log("Fetching voices from ElevenLabs API...");
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return res.json({
          voices: [],
          error: `Failed to fetch voices: ${response.statusText}`
        });
      }

      const data = await response.json();
      console.log("ElevenLabs response received:", data);

      if (!data.voices || !Array.isArray(data.voices)) {
        console.warn('Invalid response format from ElevenLabs API');
        return res.json({
          voices: [],
          warning: 'Invalid response from voice service'
        });
      }

      const voices = data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category || "Other",
        description: voice.description || "",
        previewUrl: voice.preview_url,
        settings: {
          stability: voice.settings?.stability || 0.5,
          similarity_boost: voice.settings?.similarity_boost || 0.5
        }
      }));

      res.json({ voices });
    } catch (error) {
      console.error("Error fetching voices:", error);
      res.json({
        voices: [],
        error: error instanceof Error ? error.message : "Failed to fetch voices"
      });
    }
  });

  // Chat Analytics Routes
  app.get("/api/analytics/chat", async (req: Request, res: Response) => {
    try {
      const timeRange = req.query.timeRange as string || 'week';
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Get all chat sessions within the time range
      const sessions = await storage.getVoiceChatSessions();
      const filteredSessions = sessions.filter(session => 
        new Date(session.started_at) >= startDate && new Date(session.started_at) <= now
      );

      // Calculate metrics
      const totalSessions = filteredSessions.length;
      const uniqueUsers = new Set(filteredSessions.map(session => session.user_id)).size;

      // Calculate average duration
      const durationsSum = filteredSessions.reduce((sum, session) => 
        sum + (session.duration || 0), 0);
      const averageDuration = totalSessions > 0 ? durationsSum / totalSessions : 0;

      // Calculate response rate (sessions with agent responses / total sessions)
      const sessionsWithResponses = filteredSessions.filter(session => 
        session.agent_response !== null).length;
      const responseRate = totalSessions > 0 ? sessionsWithResponses / totalSessions : 0;

      // Group sessions by date
      const sessionsByDate = filteredSessions.reduce((acc: any[], session) => {
        const date = new Date(session.started_at).toISOString().split('T')[0];
        const existingEntry = acc.find(entry => entry.date === date);

        if (existingEntry) {
          existingEntry.sessions += 1;
        } else {
          acc.push({ date, sessions: 1 });
        }

        return acc;
      }, []);

      // Fill in missing dates with zero sessions
      let currentDate = new Date(startDate);
      while (currentDate <= now) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!sessionsByDate.find(entry => entry.date === dateStr)) {
          sessionsByDate.push({ date: dateStr, sessions: 0 });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Sort by date
      sessionsByDate.sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        totalSessions,
        averageDuration,
        totalUsers: uniqueUsers,
        responseRate,
        sessionsByDate
      });
    } catch (error) {
      console.error("Error fetching chat analytics:", error);
      res.status(500).json({ error: "Failed to fetch chat analytics" });
    }
  });

  return httpServer;
}

function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function addWeeks(date: Date, weeks: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + weeks * 7);
  return newDate;
}

function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}