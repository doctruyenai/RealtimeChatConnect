import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Agents table
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isOnline: boolean("is_online").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  requestType: text("request_type"),
  content: text("content"),
  assignedAgentId: integer("assigned_agent_id"),
  status: text("status").default("active"), // active, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderType: text("sender_type").notNull(), // customer, agent
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Form fields table for customization
export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // text, select, checkbox
  label: text("label").notNull(),
  required: boolean("required").default(false),
  options: text("options"), // JSON string for select options
  order: integer("order").default(0),
});

// Insert schemas
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFormFieldSchema = createInsertSchema(formFields).omit({
  id: true,
});

// Types
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = z.infer<typeof insertFormFieldSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Pre-chat form schema
export const preChatFormSchema = z.object({
  customerName: z.string().min(1, "Vui lòng nhập họ tên"),
  customerPhone: z.string().min(1, "Vui lòng nhập số điện thoại"),
  customerAddress: z.string().optional(),
  requestType: z.string().optional(),
  content: z.string().optional(),
});

export type PreChatFormData = z.infer<typeof preChatFormSchema>;
