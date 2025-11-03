"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MessageSquare, Phone, PhoneOff } from 'lucide-react';
import { VoiceChat } from '@/components/voice/voice-chat';
import { TextChat } from '@/components/chat/text-chat';

interface UnifiedChatProps {
  roomName: string;
  livekitToken: string;
  doctorName: string;
  doctorAvatar?: string;
  visitId?: string;
  onTranscription?: (text: string, isUser: boolean) => void;
  onEndVisit?: () => void;
}

type ChatMode = 'voice' | 'text';

export function UnifiedChat({
  roomName,
  livekitToken,
  doctorName,
  doctorAvatar,
  visitId,
  onTranscription,
  onEndVisit
}: UnifiedChatProps) {
  const [chatMode, setChatMode] = useState<ChatMode>('voice');

  const handleTranscription = (text: string, isUser: boolean) => {
    onTranscription?.(text, isUser);
  };

  const handleEndVisit = () => {
    onEndVisit?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode Switcher */}
      <div className="flex justify-center p-4 bg-linear-to-br from-black via-gray-900 to-black">
        <Card className="glass-card">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Button
                variant={chatMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('voice')}
                className="flex items-center space-x-2"
              >
                <Mic className="w-4 h-4" />
                <span>Голос</span>
              </Button>
              <Button
                variant={chatMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('text')}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Текст</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        {chatMode === 'voice' ? (
          <VoiceChat
            roomName={roomName}
            livekitToken={livekitToken}
            doctorName={doctorName}
            doctorAvatar={doctorAvatar}
            visitId={visitId}
            onTranscription={handleTranscription}
            onEndVisit={handleEndVisit}
          />
        ) : (
          <TextChat
            roomName={roomName}
            doctorName={doctorName}
            doctorAvatar={doctorAvatar}
            visitId={visitId}
            onTranscription={handleTranscription}
            onEndVisit={handleEndVisit}
          />
        )}
      </div>
    </div>
  );
}
