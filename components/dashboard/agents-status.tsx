"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentStatus {
  visitId: string;
  roomName: string;
  doctorName: string;
  startedAt: string;
  pid: number;
}

export function AgentsStatus() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/livekit/agents/start');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const stopAgent = async (visitId: string) => {
    try {
      const response = await fetch(`/api/livekit/agents/start?visitId=${visitId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadAgents();
      }
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-md bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Active Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-md bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-400" />
          Active Agents ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {agents.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No active agents</p>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.visitId}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{agent.doctorName}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Room: {agent.roomName}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Started: {new Date(agent.startedAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600/20 text-green-400">
                  Active
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => stopAgent(agent.visitId)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
