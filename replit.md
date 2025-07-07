# Chat Widget Application

## Overview

This is a real-time chat widget application designed to be embedded into any website. The system consists of a React frontend for both the embeddable chat widget and agent dashboard, an Express.js backend with Socket.IO for real-time communication, and uses PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI + shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Real-time Communication**: Socket.IO (currently mocked with polling for MVP)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication for agents
- **Database Provider**: Neon Database (@neondatabase/serverless)

### Database Schema
- **agents**: Store agent credentials and online status
- **conversations**: Customer information and conversation metadata
- **messages**: Individual chat messages with sender information
- **form_fields**: Customizable form field definitions

## Key Components

### Chat Widget System
- **Embeddable Widget**: Standalone JavaScript widget that can be embedded in any website
- **Pre-chat Form**: Collects customer information before starting chat
- **Real-time Messaging**: Live chat interface with typing indicators and status
- **Responsive Design**: Mobile-friendly chat interface

### Agent Dashboard
- **Authentication**: Secure login system for up to 2 agents
- **Conversation Management**: List, search, and manage ongoing conversations
- **Real-time Chat Interface**: Send and receive messages in real-time
- **Customer Information**: View customer details and conversation history
- **Statistics Dashboard**: Overview of active conversations and agent status

### API Layer
- **RESTful Endpoints**: Standard CRUD operations for conversations and messages
- **Authentication Middleware**: JWT token verification for protected routes
- **Search Functionality**: Query conversations by customer name, phone, or content
- **Message Management**: Send messages as either customer or agent

## Data Flow

1. **Customer Interaction**:
   - Customer fills out pre-chat form on embedded widget
   - Form submission creates new conversation record
   - Customer can send messages which are stored and displayed in real-time
   - Agent assignment happens automatically (round-robin or manual)

2. **Agent Workflow**:
   - Agent logs in through dashboard
   - Views list of active conversations assigned to them
   - Can respond to customer messages in real-time
   - Messages are stored in database and synced across all connected clients

3. **Real-time Updates**:
   - Currently implemented with polling (2-3 second intervals)
   - Socket.IO infrastructure prepared for true WebSocket implementation
   - Automatic refresh of conversation lists and message threads

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework
- **jsonwebtoken**: JWT authentication implementation

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date formatting and manipulation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

### Current Setup
- **Development**: Vite dev server with Express backend
- **Build Process**: Vite builds client, esbuild bundles server
- **Database**: Neon PostgreSQL with environment-based configuration
- **Static Assets**: Chat widget served as standalone JavaScript file

### Production Considerations
- **Environment Variables**: DATABASE_URL, JWT_SECRET
- **Static File Serving**: Widget files served from public directory
- **Database Migrations**: Drizzle migrations in `/migrations` directory
- **CORS Configuration**: Configured for cross-origin widget embedding

### Scalability Features
- **Database Connection Pooling**: Handled by Neon serverless
- **Session Management**: JWT-based stateless authentication
- **Real-time Scaling**: Socket.IO adapter ready for multi-instance deployment
- **CDN Ready**: Static widget assets can be served from CDN

## Changelog
- July 07, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.