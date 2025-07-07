import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip,
  LogOut,
  BarChart3,
  CheckCheck,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConversationList from "@/components/conversation-list";
import ChatMessages from "@/components/chat-messages";
import type { Conversation, Agent, Message } from "@shared/schema";

export default function AgentDashboard() {
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get agent info
  const agent = JSON.parse(localStorage.getItem("agent") || "{}") as Agent;

  // Get conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 3000, // Poll every 3 seconds for real-time-like updates
  });

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
    refetchInterval: 2000, // Poll every 2 seconds for messages
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        "POST", 
        `/api/conversations/${selectedConversationId}/messages/agent`,
        { message },
      );
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      refetchConversations();
      toast({
        title: "Tin nhắn đã được gửi",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi gửi tin nhắn",
        description: error.message,
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("agent");
      setLocation("/login");
    },
  });

  const selectedConversation = conversations.find((conv: Conversation) => conv.id === selectedConversationId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">Dashboard Agent</h1>
          </div>
          <div className="flex items-center space-x-4">
            {stats && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <span>{stats.todayConversations} hôm nay</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{stats.pendingReplies} chờ phản hồi</span>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Agent Info */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white font-medium">
                  {agent.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AG'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <div className="font-medium text-gray-900">{agent.name}</div>
                <div className="text-sm text-gray-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Đang hoạt động
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm cuộc hội thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            searchQuery={searchQuery}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 bg-gray-300">
                      <AvatarFallback className="bg-gray-300 text-gray-600">
                        {selectedConversation.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{selectedConversation.customerName}</div>
                      <div className="text-sm text-gray-600">{selectedConversation.customerPhone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      ID: #CV{selectedConversation.id.toString().padStart(3, '0')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-blue-50 border-b">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="ml-2 font-medium">{selectedConversation.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SĐT:</span>
                    <span className="ml-2 font-medium">{selectedConversation.customerPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="ml-2 font-medium">{selectedConversation.customerAddress || "Không có"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Loại YC:</span>
                    <span className="ml-2 font-medium">{selectedConversation.requestType || "Không có"}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ChatMessages messages={messages} agentName={agent.name} />

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <Button type="button" variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={sendMessageMutation.isPending || !messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <span>Bạn đang phụ trách cuộc hội thoại này</span>
                  <span>Agent: {agent.name}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Chọn cuộc hội thoại để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
