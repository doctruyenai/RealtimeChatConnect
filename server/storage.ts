import { 
  agents, 
  conversations, 
  messages, 
  formFields,
  type Agent, 
  type InsertAgent,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type FormField,
  type InsertFormField
} from "@shared/schema";

export interface IStorage {
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgentStatus(id: number, isOnline: boolean): Promise<void>;
  getAllAgents(): Promise<Agent[]>;

  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  getConversationsByAgent(agentId: number): Promise<Conversation[]>;
  getAllConversations(): Promise<Conversation[]>;
  searchConversations(query: string): Promise<Conversation[]>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  
  // Form field methods
  getAllFormFields(): Promise<FormField[]>;
  createFormField(field: InsertFormField): Promise<FormField>;
}

export class MemStorage implements IStorage {
  private agents: Map<number, Agent>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private formFields: Map<number, FormField>;
  private currentAgentId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentFormFieldId: number;

  constructor() {
    this.agents = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.formFields = new Map();
    this.currentAgentId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentFormFieldId = 1;
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default agents
    const agent1: Agent = {
      id: this.currentAgentId++,
      email: "agent1@company.com",
      password: "password123",
      name: "Nguyễn Thị An",
      isOnline: true,
      createdAt: new Date(),
    };
    
    const agent2: Agent = {
      id: this.currentAgentId++,
      email: "agent2@company.com", 
      password: "password123",
      name: "Trần Văn Bình",
      isOnline: false,
      createdAt: new Date(),
    };

    this.agents.set(agent1.id, agent1);
    this.agents.set(agent2.id, agent2);

    // Create default form fields
    const defaultFields: Omit<FormField, 'id'>[] = [
      { fieldName: "customerName", fieldType: "text", label: "Họ và tên", required: true, options: null, order: 1 },
      { fieldName: "customerPhone", fieldType: "text", label: "Số điện thoại", required: true, options: null, order: 2 },
      { fieldName: "customerAddress", fieldType: "text", label: "Địa chỉ", required: false, options: null, order: 3 },
      { fieldName: "requestType", fieldType: "select", label: "Loại yêu cầu", required: false, 
        options: JSON.stringify([
          { value: "support", label: "Hỗ trợ kỹ thuật" },
          { value: "sales", label: "Tư vấn bán hàng" },
          { value: "complaint", label: "Khiếu nại" }
        ]), order: 4 },
      { fieldName: "content", fieldType: "textarea", label: "Nội dung", required: false, options: null, order: 5 }
    ];

    defaultFields.forEach(field => {
      const formField: FormField = { ...field, id: this.currentFormFieldId++ };
      this.formFields.set(formField.id, formField);
    });
  }

  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.email === email);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent: Agent = {
      ...insertAgent,
      id: this.currentAgentId++,
      isOnline: insertAgent.isOnline ?? false,
      createdAt: new Date(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  async updateAgentStatus(id: number, isOnline: boolean): Promise<void> {
    const agent = this.agents.get(id);
    if (agent) {
      agent.isOnline = isOnline;
      this.agents.set(id, agent);
    }
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id: this.currentConversationId++,
      content: insertConversation.content ?? null,
      status: insertConversation.status ?? "active",
      customerAddress: insertConversation.customerAddress ?? null,
      requestType: insertConversation.requestType ?? null,
      assignedAgentId: insertConversation.assignedAgentId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      const updated = { ...conversation, ...updates, updatedAt: new Date() };
      this.conversations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getConversationsByAgent(agentId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.assignedAgentId === agentId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.conversations.values())
      .filter(conv => 
        conv.customerName.toLowerCase().includes(lowerQuery) ||
        conv.customerPhone.includes(query) ||
        (conv.content && conv.content.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    
    // Update conversation timestamp
    await this.updateConversation(message.conversationId, { updatedAt: new Date() });
    
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  // Form field methods
  async getAllFormFields(): Promise<FormField[]> {
    return Array.from(this.formFields.values())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async createFormField(insertField: InsertFormField): Promise<FormField> {
    const field: FormField = {
      ...insertField,
      id: this.currentFormFieldId++,
      order: insertField.order ?? 0,
      required: insertField.required ?? false,
      options: insertField.options ?? null,
    };
    this.formFields.set(field.id, field);
    return field;
  }
}

export const storage = new MemStorage();
