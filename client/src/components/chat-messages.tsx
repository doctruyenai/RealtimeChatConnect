import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Message } from "@shared/schema";

interface ChatMessagesProps {
  messages: Message[];
  agentName: string;
}

export default function ChatMessages({ messages, agentName }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "HH:mm", { locale: vi });
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Chưa có tin nhắn nào</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start ${
              message.senderType === "agent" ? "justify-end" : ""
            }`}
          >
            {message.senderType === "customer" && (
              <Avatar className="h-6 w-6 bg-gray-300 flex-shrink-0 mr-2">
                <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">
                  KH
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 text-right">
              <div
                className={`inline-block p-3 rounded-lg max-w-xs ${
                  message.senderType === "agent"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-900 rounded-tl-none"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.message}
                </div>
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.senderType === "agent" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>

            {message.senderType === "agent" && (
              <Avatar className="h-6 w-6 bg-blue-600 flex-shrink-0 ml-2">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  {agentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
