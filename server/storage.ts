import { users, agents, phoneNumbers, callHistory, apiConfigurations, websiteCrawls, voiceChatSessions, knowledgeDocuments, type User, type InsertUser, type Agent, type InsertAgent, type PhoneNumber, type InsertPhoneNumber, type CallHistory, type InsertCallHistory, type ApiConfiguration, type InsertApiConfiguration, type WebsiteCrawl, type InsertWebsiteCrawl, type VoiceChatSession, type InsertVoiceChatSession, type KnowledgeDocument, type InsertKnowledgeDocument } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Agent operations
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent>;

  // Phone number operations
  getPhoneNumbers(userId: number): Promise<PhoneNumber[]>;
  getPhoneNumber(id: number): Promise<PhoneNumber | undefined>;
  createPhoneNumber(phoneNumber: InsertPhoneNumber): Promise<PhoneNumber>;
  updatePhoneNumber(id: number, phoneNumber: Partial<InsertPhoneNumber>): Promise<PhoneNumber>;

  // Call history operations
  getCallHistory(userId: number): Promise<CallHistory[]>;
  getCallById(id: number): Promise<CallHistory | undefined>;
  createCallHistory(call: InsertCallHistory): Promise<CallHistory>;
  updateCallHistory(id: number, call: Partial<InsertCallHistory>): Promise<CallHistory>;

  // API configuration operations
  getApiConfigurations(userId: number): Promise<ApiConfiguration[]>;
  getApiConfiguration(id: number): Promise<ApiConfiguration | undefined>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: number, config: Partial<InsertApiConfiguration>): Promise<ApiConfiguration>;
  deleteApiConfiguration(id: number): Promise<void>;

  // Website crawl operations
  getWebsiteCrawls(userId: number): Promise<WebsiteCrawl[]>;
  getWebsiteCrawl(id: number): Promise<WebsiteCrawl | undefined>;
  createWebsiteCrawl(crawl: InsertWebsiteCrawl): Promise<WebsiteCrawl>;
  updateWebsiteCrawl(id: number, crawl: Partial<InsertWebsiteCrawl>): Promise<WebsiteCrawl>;

  // Voice chat session operations
  getVoiceChatSessions(userId: number): Promise<VoiceChatSession[]>;
  getVoiceChatSession(id: string): Promise<VoiceChatSession | undefined>;
  createVoiceChatSession(session: InsertVoiceChatSession): Promise<VoiceChatSession>;
  updateVoiceChatSession(id: string, session: Partial<InsertVoiceChatSession>): Promise<VoiceChatSession>;

  // Knowledge document operations
  getKnowledgeDocuments(): Promise<KnowledgeDocument[]>;
  getKnowledgeDocument(id: number): Promise<KnowledgeDocument | undefined>;
  createKnowledgeDocument(document: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  updateKnowledgeDocument(id: number, document: Partial<InsertKnowledgeDocument>): Promise<KnowledgeDocument>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents);
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values({
      ...insertAgent,
      type: insertAgent.type || 'ai',
      isActive: insertAgent.isActive ?? true,
    }).returning();
    return agent;
  }

  async updateAgent(id: number, update: Partial<InsertAgent>): Promise<Agent> {
    const [agent] = await db
      .update(agents)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    if (!agent) throw new Error(`Agent with id ${id} not found`);
    return agent;
  }

  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    return db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId));
  }

  async getPhoneNumber(id: number): Promise<PhoneNumber | undefined> {
    const [phoneNumber] = await db.select().from(phoneNumbers).where(eq(phoneNumbers.id, id));
    return phoneNumber;
  }

  async createPhoneNumber(insertPhoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const [phoneNumber] = await db.insert(phoneNumbers).values({
      ...insertPhoneNumber,
      isActive: insertPhoneNumber.isActive ?? true,
    }).returning();
    return phoneNumber;
  }

  async updatePhoneNumber(id: number, update: Partial<InsertPhoneNumber>): Promise<PhoneNumber> {
    const [phoneNumber] = await db
      .update(phoneNumbers)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(phoneNumbers.id, id))
      .returning();
    if (!phoneNumber) throw new Error(`Phone number with id ${id} not found`);
    return phoneNumber;
  }

  async getCallHistory(userId: number): Promise<CallHistory[]> {
    return db
      .select()
      .from(callHistory)
      .where(eq(callHistory.userId, userId))
      .orderBy(desc(callHistory.startedAt));
  }

  async getCallById(id: number): Promise<CallHistory | undefined> {
    const [call] = await db.select().from(callHistory).where(eq(callHistory.id, id));
    return call;
  }

  async createCallHistory(insertCall: InsertCallHistory): Promise<CallHistory> {
    const [call] = await db.insert(callHistory).values(insertCall).returning();
    return call;
  }

  async updateCallHistory(id: number, update: Partial<InsertCallHistory>): Promise<CallHistory> {
    const [call] = await db
      .update(callHistory)
      .set(update)
      .where(eq(callHistory.id, id))
      .returning();
    if (!call) throw new Error(`Call with id ${id} not found`);
    return call;
  }

  async getApiConfigurations(userId: number): Promise<ApiConfiguration[]> {
    return db.select().from(apiConfigurations).where(eq(apiConfigurations.userId, userId));
  }

  async getApiConfiguration(id: number): Promise<ApiConfiguration | undefined> {
    const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.id, id));
    return config;
  }

  async createApiConfiguration(insertConfig: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [config] = await db.insert(apiConfigurations).values({
      ...insertConfig,
      isActive: insertConfig.isActive ?? true,
    }).returning();
    return config;
  }

  async updateApiConfiguration(id: number, update: Partial<InsertApiConfiguration>): Promise<ApiConfiguration> {
    const [config] = await db
      .update(apiConfigurations)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(apiConfigurations.id, id))
      .returning();
    if (!config) throw new Error(`API configuration with id ${id} not found`);
    return config;
  }

  async deleteApiConfiguration(id: number): Promise<void> {
    await db.delete(apiConfigurations).where(eq(apiConfigurations.id, id));
  }

  async updateUser(id: number, update: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  }

  async getWebsiteCrawls(userId: number): Promise<WebsiteCrawl[]> {
    return db
      .select()
      .from(websiteCrawls)
      .where(eq(websiteCrawls.userId, userId))
      .orderBy(desc(websiteCrawls.createdAt));
  }

  async getWebsiteCrawl(id: number): Promise<WebsiteCrawl | undefined> {
    const [crawl] = await db
      .select()
      .from(websiteCrawls)
      .where(eq(websiteCrawls.id, id));
    return crawl;
  }

  async createWebsiteCrawl(insertCrawl: InsertWebsiteCrawl): Promise<WebsiteCrawl> {
    const [crawl] = await db
      .insert(websiteCrawls)
      .values({
        ...insertCrawl,
        status: insertCrawl.status || 'pending',
      })
      .returning();
    return crawl;
  }

  async updateWebsiteCrawl(id: number, update: Partial<InsertWebsiteCrawl>): Promise<WebsiteCrawl> {
    const [crawl] = await db
      .update(websiteCrawls)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(websiteCrawls.id, id))
      .returning();
    if (!crawl) throw new Error(`Website crawl with id ${id} not found`);
    return crawl;
  }

  async getVoiceChatSessions(userId: number): Promise<VoiceChatSession[]> {
    return db
      .select()
      .from(voiceChatSessions)
      .where(eq(voiceChatSessions.user_id, userId))
      .orderBy(desc(voiceChatSessions.started_at));
  }

  async getVoiceChatSession(id: string): Promise<VoiceChatSession | undefined> {
    const [session] = await db
      .select()
      .from(voiceChatSessions)
      .where(eq(voiceChatSessions.session_id, id));
    return session;
  }

  async createVoiceChatSession(insertSession: InsertVoiceChatSession): Promise<VoiceChatSession> {
    const [session] = await db
      .insert(voiceChatSessions)
      .values({
        ...insertSession,
        status: insertSession.status || 'active',
      })
      .returning();
    return session;
  }

  async updateVoiceChatSession(id: string, update: Partial<InsertVoiceChatSession>): Promise<VoiceChatSession> {
    const [session] = await db
      .update(voiceChatSessions)
      .set(update)
      .where(eq(voiceChatSessions.session_id, id))
      .returning();
    if (!session) throw new Error(`Voice chat session with id ${id} not found`);
    return session;
  }

  async getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
    return db
      .select()
      .from(knowledgeDocuments)
      .orderBy(desc(knowledgeDocuments.createdAt));
  }

  async getKnowledgeDocument(id: number): Promise<KnowledgeDocument | undefined> {
    const [document] = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, id));
    return document;
  }

  async createKnowledgeDocument(insertDocument: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
    const [document] = await db
      .insert(knowledgeDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateKnowledgeDocument(id: number, update: Partial<InsertKnowledgeDocument>): Promise<KnowledgeDocument> {
    const [document] = await db
      .update(knowledgeDocuments)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, id))
      .returning();
    if (!document) throw new Error(`Knowledge document with id ${id} not found`);
    return document;
  }
}

export const storage = new DatabaseStorage();