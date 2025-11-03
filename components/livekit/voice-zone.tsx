"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveKitStore } from "@/stores/livekit-store";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AudioVisualizer } from "./audio-visualizer";
import { TrackStatus } from "./track-status";

interface VoiceZoneProps {
  roomName: string;
  token: string;
  doctorName?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function VoiceZone({
  roomName,
  token,
  doctorName = "AI Doctor",
  onConnected,
  onDisconnected,
}: VoiceZoneProps) {
  const { isConnected, error, room, participants } = useLiveKitStore();
  const { connect, disconnect, publishAudio } = useLiveKitRoom({
    roomName,
    token,
    onConnected,
    onDisconnected,
  });
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (token && roomName && !isConnected) {
      connect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [token, roomName, isConnected, connect, disconnect]);

  const handleMicToggle = async () => {
    const newState = !isMicEnabled;
    await publishAudio(newState);
    setIsMicEnabled(newState);
  };

  const handleAudioToggle = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    // Mute/unmute всех remote аудио треков через audio элементы
    try {
      const audioElements = document.querySelectorAll<HTMLAudioElement>(
        'audio[data-participant-id]'
      );
      
      audioElements.forEach((audioEl) => {
        audioEl.volume = newState ? 1.0 : 0;
        audioEl.muted = !newState;
      });
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  return (
    <Card className="backdrop-blur-md bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-400" />
          Voice Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-300">
            {isConnected ? "Connected" : error || "Connecting..."}
          </span>
        </div>

        {/* Doctor Avatar & Audio Visualizer */}
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-24 w-24 border-2 border-blue-400/50">
            <AvatarFallback className="bg-blue-600/20 text-2xl text-blue-400">
              {doctorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Audio Visualizer для агента */}
          {isConnected && room && participants.size > 0 && (
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <Waves className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-400">Agent Audio</span>
              </div>
              <AudioVisualizer 
                room={room} 
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-white font-medium">{doctorName}</p>
          <p className="text-sm text-gray-400">AI Doctor</p>
        </div>

        {/* Participants & Track Status */}
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-400">
            {participants.size + 1} participant{participants.size + 1 !== 1 ? "s" : ""} in room
          </div>
          
          {/* Track Status */}
          {isConnected && room && (
            <TrackStatus room={room} />
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center pt-4">
          <Button
            variant={isMicEnabled ? "default" : "destructive"}
            size="lg"
            onClick={handleMicToggle}
            disabled={!isConnected}
            className="h-14 w-14 rounded-full"
          >
            {isMicEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant={isAudioEnabled ? "default" : "outline"}
            size="lg"
            onClick={handleAudioToggle}
            disabled={!isConnected}
            className="h-14 w-14 rounded-full"
          >
            {isAudioEnabled ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
