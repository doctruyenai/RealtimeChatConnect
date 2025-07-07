import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import PreChatForm from "@/components/pre-chat-form";
import ChatMessages from "@/components/chat-messages";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

interface ChatWidgetProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  primaryColor?: string;
  apiUrl?: string;
}

export default function ChatWidget({
  position = "bottom-right",
  primaryColor = "#2196F3",
  apiUrl = "/api",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const queryClient = useQueryClient();

  // Get messages for current conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Send customer message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        "POST",
        `/api/conversations/${conversationId}/messages`,
        {
          senderType: "customer",
          senderName: "Khách hàng",
          message,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
  });

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const handleStartChat = (conversation: Conversation) => {
    setConversationId(conversation.id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversationId) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleToggle = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-all duration-300"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            3
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`w-80 shadow-2xl border-0 ${isMinimized ? "h-14" : "h-96"} transition-all duration-300`}>
          {/* Header */}
          <CardHeader 
            className="p-4 text-white rounded-t-lg flex flex-row items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-sm">Hỗ trợ khách hàng</div>
                <div className="text-xs opacity-80 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Đang hoạt động
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-80">
              {!conversationId ? (
                <PreChatForm onStartChat={handleStartChat} />
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-hidden">
                    <ChatMessages messages={messages} agentName="Agent" />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 text-sm"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        style={{ backgroundColor: primaryColor }}
                        disabled={sendMessageMutation.isPending || !messageInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
