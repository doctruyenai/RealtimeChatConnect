import { useEffect } from "react";
import { useLocation } from "wouter";
import AgentDashboard from "@/components/agent-dashboard";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLocation("/login");
    }
  }, [setLocation]);

  return <AgentDashboard />;
}
