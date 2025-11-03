"use client";

import { useEffect, useState } from "react";
import { Room, RemoteParticipant, Track } from "livekit-client";
import { Badge } from "@/components/ui/badge";
import { Radio, Mic, Volume2 } from "lucide-react";

interface TrackStatusProps {
  room: Room | null;
}

export function TrackStatus({ room }: TrackStatusProps) {
  const [tracks, setTracks] = useState<Map<string, {
    participant: RemoteParticipant;
    hasAudio: boolean;
    hasVideo: boolean;
    audioMuted: boolean;
  }>>(new Map());

  useEffect(() => {
    if (!room) return;

    const updateTracks = () => {
      const trackMap = new Map();

      // Local participant tracks
      const localAudio = Array.from(room.localParticipant.audioTrackPublications.values())
        .find(pub => pub.track);
      const localVideo = Array.from(room.localParticipant.videoTrackPublications.values())
        .find(pub => pub.track);

      if (localAudio || localVideo) {
        trackMap.set('local', {
          participant: room.localParticipant as any,
          hasAudio: !!localAudio?.track,
          hasVideo: !!localVideo?.track,
          audioMuted: localAudio?.isMuted || false,
        });
      }

      // Remote participants tracks (agents)
      room.remoteParticipants.forEach((participant) => {
        const audioPub = Array.from(participant.audioTrackPublications.values())
          .find(pub => pub.isSubscribed && pub.track);
        const videoPub = Array.from(participant.videoTrackPublications.values())
          .find(pub => pub.isSubscribed && pub.track);

        if (audioPub || videoPub) {
          trackMap.set(participant.sid, {
            participant,
            hasAudio: !!audioPub?.track,
            hasVideo: !!videoPub?.track,
            audioMuted: audioPub?.isMuted || false,
          });
        }
      });

      setTracks(trackMap);
    };

    updateTracks();

    // Обновляем при изменении треков
    room.on('trackSubscribed', updateTracks);
    room.on('trackUnsubscribed', updateTracks);
    room.on('trackPublished', updateTracks);
    room.on('trackUnpublished', updateTracks);
    room.on('trackMuted', updateTracks);
    room.on('trackUnmuted', updateTracks);
    room.on('participantConnected', updateTracks);
    room.on('participantDisconnected', updateTracks);

    return () => {
      room.off('trackSubscribed', updateTracks);
      room.off('trackUnsubscribed', updateTracks);
      room.off('trackPublished', updateTracks);
      room.off('trackUnpublished', updateTracks);
      room.off('trackMuted', updateTracks);
      room.off('trackUnmuted', updateTracks);
      room.off('participantConnected', updateTracks);
      room.off('participantDisconnected', updateTracks);
    };
  }, [room]);

  if (tracks.size === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {Array.from(tracks.entries()).map(([sid, trackInfo]) => (
        <div
          key={sid}
          className="flex items-center justify-between p-2 bg-white/5 rounded-md text-xs"
        >
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-blue-400" />
            <span className="text-gray-300">
              {trackInfo.participant.identity === room?.localParticipant.identity
                ? 'You'
                : trackInfo.participant.identity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {trackInfo.hasAudio && (
              <Badge
                variant={trackInfo.audioMuted ? "outline" : "default"}
                className="h-5 text-xs"
              >
                {trackInfo.audioMuted ? (
                  <Mic className="h-3 w-3 mr-1" />
                ) : (
                  <Volume2 className="h-3 w-3 mr-1" />
                )}
                Audio
              </Badge>
            )}
            {trackInfo.hasVideo && (
              <Badge variant="default" className="h-5 text-xs">
                Video
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

