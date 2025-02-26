import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("ai").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  voiceId: text("voice_id"),
  systemPrompt: text("system_prompt"),
  voiceSettings: jsonb("voice_settings"),
});

export const phoneNumbers = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  label: text("label").notNull(),
  twilioSid: text("twilio_sid").notNull(),
  twilioToken: text("twilio_token").notNull(),
  agentId: integer("agent_id").references(() => agents.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const callHistory = pgTable("call_history", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  phoneNumberId: integer("phone_number_id").references(() => phoneNumbers.id),
  source: text("source").notNull(),
  duration: integer("duration").notNull(),
  status: text("status").notNull(),
  recordingEnabled: boolean("recording_enabled").default(true).notNull(),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  content: text("content"),
  embeddings: jsonb("embeddings"),
  metadata: jsonb("metadata"),
  agentId: integer("agent_id").references(() => agents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const websiteCrawls = pgTable("website_crawls", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status").notNull(),
  crawlData: jsonb("crawl_data"),
  error: text("error"),
  agentId: integer("agent_id").references(() => agents.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  scheduledAt: timestamp("scheduled_at"),
  scheduleRecurrence: text("schedule_recurrence"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  batchId: text("batch_id"),
  crawlConfig: jsonb("crawl_config"),
});

export const voiceChatSessions = pgTable("voice_chat_sessions", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull(), 
  user_id: integer("user_id").references(() => users.id).notNull(),
  agent_id: integer("agent_id").references(() => agents.id).notNull(),
  status: text("status").notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  ended_at: timestamp("ended_at"),
  transcription: text("transcription"),
  agent_response: text("agent_response"),
  metadata: jsonb("metadata"),
  duration: integer("duration"),
});

export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  apiKey: text("api_key").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallHistorySchema = createInsertSchema(callHistory).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebsiteCrawlSchema = createInsertSchema(websiteCrawls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  crawlData: true,
  error: true,
}).extend({
  scheduleRecurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  scheduledAt: z.string().datetime().optional(),
  crawlConfig: z.object({
    depth: z.number().min(1).max(5).default(2),
    maxPages: z.number().min(1).max(100).default(10),
    selector: z.string().default("article, p, h1, h2, h3, h4, h5, h6"),
    filters: z.array(z.string()).optional(),
  }).optional(),
});

export const insertVoiceChatSessionSchema = createInsertSchema(voiceChatSessions).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type InsertCallHistory = z.infer<typeof insertCallHistorySchema>;
export type CallHistory = typeof callHistory.$inferSelect;
export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertWebsiteCrawl = z.infer<typeof insertWebsiteCrawlSchema>;
export type WebsiteCrawl = typeof websiteCrawls.$inferSelect;
export type InsertVoiceChatSession = z.infer<typeof insertVoiceChatSessionSchema>;
export type VoiceChatSession = typeof voiceChatSessions.$inferSelect;