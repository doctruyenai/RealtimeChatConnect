import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCheck } from "lucide-react";
import type { Conversation } from "@shared/schema";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  searchQuery: string;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
}: ConversationListProps) {
  
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.customerName.toLowerCase().includes(query) ||
      conv.customerPhone.includes(query) ||
      (conv.content && conv.content.toLowerCase().includes(query))
    );
  });

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          {searchQuery ? "Không tìm thấy cuộc hội thoại" : "Chưa có cuộc hội thoại nào"}
        </div>
      ) : (
        filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors ${
              selectedConversationId === conversation.id
                ? "bg-blue-50 border-l-4 border-l-blue-600"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="font-medium text-gray-900 truncate">
                    {conversation.customerName}
                  </div>
                  {conversation.status === "active" && (
                    <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate mt-1">
                  {conversation.content || "Cuộc hội thoại mới"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(conversation.updatedAt)}
                </div>
              </div>
              <div className="flex items-center">
                {conversation.status === "closed" ? (
                  <CheckCheck className="h-4 w-4 text-blue-600" />
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Mới
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
