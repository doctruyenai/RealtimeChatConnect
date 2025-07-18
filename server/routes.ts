import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  preChatFormSchema, 
  insertMessageSchema,
  type Agent,
  type Conversation,
  type Message 
} from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function verifyToken(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token khong duoc cung cap" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.agent = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token khong hop le" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Agent authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const agent = await storage.getAgentByEmail(email);
      if (!agent || agent.password !== password) {
        return res.status(401).json({ message: "Email hoac mat khau khong dung" });
      }

      // Update agent status to online
      await storage.updateAgentStatus(agent.id, true);

      const token = jwt.sign(
        { id: agent.id, email: agent.email, name: agent.name },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ 
        token, 
        agent: { 
          id: agent.id, 
          email: agent.email, 
          name: agent.name, 
          isOnline: true 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Du lieu khong hop le" });
    }
  });

  app.post("/api/auth/logout", verifyToken, async (req: any, res) => {
    try {
      await storage.updateAgentStatus(req.agent.id, false);
      res.json({ message: "Dang xuat thanh cong" });
    } catch (error) {
      res.status(500).json({ message: "Loi dang xuat" });
    }
  });

  // Get current agent info
  app.get("/api/auth/me", verifyToken, async (req: any, res) => {
    try {
      const agent = await storage.getAgent(req.agent.id);
      if (!agent) {
        return res.status(404).json({ message: "Agent khong ton tai" });
      }
      res.json({ 
        id: agent.id, 
        email: agent.email, 
        name: agent.name, 
        isOnline: agent.isOnline 
      });
    } catch (error) {
      res.status(500).json({ message: "Loi server" });
    }
  });

  // Get all form fields
  app.get("/api/form-fields", async (req, res) => {
    try {
      const fields = await storage.getAllFormFields();
      res.json(fields);
    } catch (error) {
      res.status(500).json({ message: "Loi lay form fields" });
    }
  });

  // Create new conversation (from widget)
  app.post("/api/conversations", async (req, res) => {
    try {
      const formData = preChatFormSchema.parse(req.body);
      
      // Assign to first available online agent
      const agents = await storage.getAllAgents();
      const onlineAgent = agents.find(agent => agent.isOnline);
      
      const conversation = await storage.createConversation({
        ...formData,
        assignedAgentId: onlineAgent?.id || null,
        status: "active"
      });

      // Create initial system message
      if (onlineAgent) {
        await storage.createMessage({
          conversationId: conversation.id,
          senderType: "agent",
          senderName: onlineAgent.name,
          message: "Xin chao! Toi co the giup gi cho ban?"
        });
      }

      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Du lieu khong hop le" });
    }
  });

  // Get conversations for agent
  app.get("/api/conversations", verifyToken, async (req: any, res) => {
    try {
      const conversations = await storage.getConversationsByAgent(req.agent.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Loi lay danh sach cuoc hoi thoai" });
    }
  });

  // Get all conversations (for admin view)
  app.get("/api/conversations/all", verifyToken, async (req: any, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Loi lay danh sach cuoc hoi thoai" });
    }
  });

  // Search conversations
  app.get("/api/conversations/search", verifyToken, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Vui long nhap tu khoa tim kiem" });
      }
      
      const conversations = await storage.searchConversations(query);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Loi tim kiem cuoc hoi thoai" });
    }
  });

  // Get specific conversation
  app.get("/api/conversations/:id", verifyToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Cuoc hoi thoai khong ton tai" });
      }

      // Check if agent has access to this conversation
      if (conversation.assignedAgentId !== req.agent.id) {
        return res.status(403).json({ message: "Ban khong co quyen truy cap cuoc hoi thoai nay" });
      }

      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Loi lay thong tin cuoc hoi thoai" });
    }
  });

  // Get messages for conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Loi lay tin nhan" });
    }
  });

  // Send message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { senderType, senderName, message } = req.body;

      const newMessage = await storage.createMessage({
        conversationId,
        senderType,
        senderName,
        message
      });

      res.json(newMessage);
    } catch (error) {
      res.status(400).json({ message: "Lỗi gửi tin nhắn" });
    }
  });

  // Agent send message
  app.post("/api/conversations/:id/messages/agent", verifyToken, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { message } = req.body;

      if (!message || message.trim() === "") {
        return res.status(400).json({ message: "Noi dung tin nhan khong duoc de trong" });
      }

      // Check if conversation exists and agent has access
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Cuoc hoi thoai khong ton tai" });
      }

      if (conversation.assignedAgentId !== req.agent.id) {
        return res.status(403).json({ message: "Ban khong co quyen tra loi cuoc hoi thoai nay" });
      }

      const newMessage = await storage.createMessage({
        conversationId,
        senderType: "agent",
        senderName: req.agent.name,
        message: message.trim()
      });

      res.json(newMessage);
    } catch (error) {
      res.status(500).json({ message: "Loi gui tin nhan" });
    }
  });

  // Update conversation status
  app.patch("/api/conversations/:id", verifyToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Cuoc hoi thoai khong ton tai" });
      }

      if (conversation.assignedAgentId !== req.agent.id) {
        return res.status(403).json({ message: "Ban khong co quyen cap nhat cuoc hoi thoai nay" });
      }

      const updated = await storage.updateConversation(id, { status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Loi cap nhat cuoc hoi thoai" });
    }
  });

  // Get agent statistics
  app.get("/api/stats", verifyToken, async (req: any, res) => {
    try {
      const conversations = await storage.getConversationsByAgent(req.agent.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayConversations = conversations.filter(conv => 
        conv.createdAt && conv.createdAt >= today
      ).length;

      const pendingReplies = conversations.filter(conv => 
        conv.status === "active"
      ).length;

      res.json({
        todayConversations,
        pendingReplies,
        avgResponseTime: "2m 30s", // Mock data for MVP
        satisfaction: 4.8 // Mock data for MVP
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi lấy thống kê" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
