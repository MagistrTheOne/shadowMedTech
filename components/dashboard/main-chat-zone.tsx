"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextChat } from "@/components/chat/text-chat";
import { VoiceZone } from "@/components/livekit/voice-zone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Radio } from "lucide-react";

interface MainChatZoneProps {
  visitId?: string;
  roomName?: string;
  token?: string;
  doctorName?: string;
}

export function MainChatZone({
  visitId,
  roomName,
  token,
  doctorName,
}: MainChatZoneProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("voice");

  if (!visitId) {
    return (
      <Card className="backdrop-blur-md bg-white/5 border-white/10 h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-gray-400">Select a visit to start conversation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "voice")} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="flex-1 m-0">
          {roomName && token ? (
            <VoiceZone
              roomName={roomName}
              token={token}
              doctorName={doctorName}
            />
          ) : (
            <Card className="backdrop-blur-md bg-white/5 border-white/10 h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-gray-400">Waiting for LiveKit connection...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 m-0">
          {visitId ? (
            <TextChat visitId={visitId} />
          ) : (
            <Card className="backdrop-blur-md bg-white/5 border-white/10 h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-gray-400">No active visit</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
