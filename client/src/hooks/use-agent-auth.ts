import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/chat-api";
import { useLocation } from "wouter";
import type { Agent, LoginRequest } from "@shared/schema";

export function useAgentAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [agent, setAgent] = useState<Agent | null>(() => {
    const stored = localStorage.getItem("agent");
    return stored ? JSON.parse(stored) : null;
  });

  // Check if token is valid and get current agent
  const { data: currentAgent, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: chatApi.getCurrentAgent,
    enabled: !!localStorage.getItem("token"),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: chatApi.login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("agent", JSON.stringify(data.agent));
      setAgent(data.agent);
      setLocation("/dashboard");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: chatApi.logout,
    onSuccess: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("agent");
      setAgent(null);
      queryClient.clear();
      setLocation("/login");
    },
  });

  // Update agent state when current agent data changes
  useEffect(() => {
    if (currentAgent && !agent) {
      setAgent(currentAgent);
    }
  }, [currentAgent, agent]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAgent(null);
    }
  }, []);

  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const isAuthenticated = !!agent && !!localStorage.getItem("token");

  return {
    agent,
    isAuthenticated,
    isCheckingAuth,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login,
    logout,
    loginError: loginMutation.error,
  };
}
