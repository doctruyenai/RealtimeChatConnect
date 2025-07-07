import { apiRequest } from "./queryClient";
import type { 
  LoginRequest, 
  PreChatFormData, 
  Conversation, 
  Message, 
  Agent 
} from "@shared/schema";

export const chatApi = {
  // Authentication
  login: async (credentials: LoginRequest) => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  getCurrentAgent: async () => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  // Conversations
  createConversation: async (data: PreChatFormData) => {
    const response = await apiRequest("POST", "/api/conversations", data);
    return response.json();
  },

  getConversations: async () => {
    const response = await apiRequest("GET", "/api/conversations");
    return response.json();
  },

  getAllConversations: async () => {
    const response = await apiRequest("GET", "/api/conversations/all");
    return response.json();
  },

  searchConversations: async (query: string) => {
    const response = await apiRequest("GET", `/api/conversations/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getConversation: async (id: number) => {
    const response = await apiRequest("GET", `/api/conversations/${id}`);
    return response.json();
  },

  updateConversation: async (id: number, updates: Partial<Conversation>) => {
    const response = await apiRequest("PATCH", `/api/conversations/${id}`, updates);
    return response.json();
  },

  // Messages
  getMessages: async (conversationId: number) => {
    const response = await apiRequest("GET", `/api/conversations/${conversationId}/messages`);
    return response.json();
  },

  sendCustomerMessage: async (conversationId: number, message: string, senderName: string = "Khách hàng") => {
    const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
      senderType: "customer",
      senderName,
      message,
    });
    return response.json();
  },

  sendAgentMessage: async (conversationId: number, message: string) => {
    const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages/agent`, {
      message,
    });
    return response.json();
  },

  // Form fields
  getFormFields: async () => {
    const response = await apiRequest("GET", "/api/form-fields");
    return response.json();
  },

  // Statistics
  getStats: async () => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
