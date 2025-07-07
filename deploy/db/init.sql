-- Database initialization script for Chat Real-time System
-- This script will be run when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    request_type VARCHAR(100),
    content TEXT,
    assigned_agent_id INTEGER REFERENCES agents(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'agent')),
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form_fields table
CREATE TABLE IF NOT EXISTS form_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    options TEXT,
    "order" INTEGER DEFAULT 0
);

-- Insert default agents
INSERT INTO agents (email, password, name, is_online) VALUES
    ('agent1@company.com', 'password123', 'Nguyễn Thị An', true),
    ('agent2@company.com', 'password123', 'Trần Văn Bình', false)
ON CONFLICT (email) DO NOTHING;

-- Insert default form fields
INSERT INTO form_fields (field_name, field_type, label, required, options, "order") VALUES
    ('customerName', 'text', 'Họ và tên', true, null, 1),
    ('customerPhone', 'text', 'Số điện thoại', true, null, 2),
    ('customerAddress', 'text', 'Địa chỉ', false, null, 3),
    ('requestType', 'select', 'Loại yêu cầu', false, '[{"value":"support","label":"Hỗ trợ kỹ thuật"},{"value":"sales","label":"Tư vấn bán hàng"},{"value":"complaint","label":"Khiếu nại"}]', 4),
    ('content', 'textarea', 'Nội dung', false, null, 5)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_user;

-- Insert sample conversation for testing
INSERT INTO conversations (customer_name, customer_phone, customer_address, request_type, content, assigned_agent_id, status) VALUES
    ('Nguyễn Văn Test', '0123456789', 'Hà Nội', 'support', 'Tôi cần hỗ trợ về sản phẩm', 1, 'active')
ON CONFLICT DO NOTHING;

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_type, sender_name, message) VALUES
    (1, 'customer', 'Nguyễn Văn Test', 'Xin chào, tôi cần hỗ trợ'),
    (1, 'agent', 'Nguyễn Thị An', 'Xin chào! Tôi có thể giúp gì cho bạn?')
ON CONFLICT DO NOTHING;