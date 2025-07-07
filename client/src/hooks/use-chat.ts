import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/chat-api";
import { socketClient } from "@/lib/socket-client";
import type { Conversation, Message } from "@shared/schema";

export function useChat(conversationId?: number) {
  const queryClient = useQueryClient();

  // Get messages for conversation
  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    queryFn: () => conversationId ? chatApi.getMessages(conversationId) : Promise.resolve([]),
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds for real-time-like updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, isAgent = false }: { message: string; isAgent?: boolean }) => {
      if (!conversationId) throw new Error("No conversation ID");
      
      if (isAgent) {
        return chatApi.sendAgentMessage(conversationId, message);
      } else {
        return chatApi.sendCustomerMessage(conversationId, message);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
      refetchMessages();
    },
  });

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (data: Message) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", conversationId, "messages"] 
        });
        refetchMessages();
      }
    };

    const handleTyping = (data: { conversationId: number; isTyping: boolean }) => {
      if (data.conversationId === conversationId) {
        // Handle typing indicator
        console.log("User is typing:", data.isTyping);
      }
    };

    socketClient.on("new_message", handleNewMessage);
    socketClient.on("typing", handleTyping);

    return () => {
      socketClient.off("new_message", handleNewMessage);
      socketClient.off("typing", handleTyping);
    };
  }, [conversationId, queryClient, refetchMessages]);

  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
    refetchMessages,
  };
}

export function useConversations() {
  const queryClient = useQueryClient();

  // Get conversations
  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations,
    refetch: refetchConversations 
  } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: chatApi.getConversations,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      refetchConversations();
    },
  });

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Conversation> }) =>
      chatApi.updateConversation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      refetchConversations();
    },
  });

  return {
    conversations,
    isLoadingConversations,
    createConversation: createConversationMutation.mutate,
    updateConversation: updateConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending,
    isUpdatingConversation: updateConversationMutation.isPending,
    refetchConversations,
  };
}
