"use client";

import { AgentsStatus } from "@/components/dashboard/agents-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Settings, Code } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Agents Management</h1>
        <p className="text-gray-400">Monitor and manage active voice AI agents</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <AgentsStatus />
        </div>

        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Agent Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current agent settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">STT Provider</span>
                <Badge variant="outline" className="text-green-400 border-green-400/20">
                  OpenAI Whisper
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">TTS Provider</span>
                <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                  Silero TTS
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">LLM Provider</span>
                <Badge variant="outline" className="text-purple-400 border-purple-400/20">
                  GigaChat
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Language</span>
                <Badge variant="outline" className="text-white">
                  Russian (ru)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="h-5 w-5" />
              Agent Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              System health and logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-gray-400 text-sm">Agent Process</span>
                <Badge variant="default" className="bg-green-600/20 text-green-400">
                  Running
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-gray-400 text-sm">LiveKit Connection</span>
                <Badge variant="default" className="bg-green-600/20 text-green-400">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-gray-400 text-sm">GigaChat API</span>
                <Badge variant="default" className="bg-green-600/20 text-green-400">
                  Available
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
