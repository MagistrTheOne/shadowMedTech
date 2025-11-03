"use client";

import { useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant, Track } from 'livekit-client';
import { useLiveKitStore } from '@/stores/livekit-store';
import { useChatStore } from '@/stores/chat-store';

interface UseLiveKitRoomOptions {
  roomName: string;
  token: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function useLiveKitRoom({
  roomName,
  token,
  onConnected,
  onDisconnected,
  onError,
}: UseLiveKitRoomOptions) {
  const roomRef = useRef<Room | null>(null);
  const {
    setRoom,
    setLocalParticipant,
    addParticipant,
    removeParticipant,
    setConnected,
    setError,
  } = useLiveKitStore();
  const { addMessage } = useChatStore();

  const connect = useCallback(async () => {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event handlers BEFORE connecting
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room:', roomName);
        setRoom(room);
        setLocalParticipant(room.localParticipant);
        setConnected(true);
        onConnected?.();
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room:', roomName);
        setRoom(null);
        setLocalParticipant(null);
        setConnected(false);
        onDisconnected?.();
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity);
        addParticipant(participant);

        // Handle participant metadata for chat
        if (participant.metadata) {
          try {
            const metadata = JSON.parse(participant.metadata);
            if (metadata.type === 'greeting') {
              addMessage({
                id: `msg-${Date.now()}-${Math.random()}`,
                text: metadata.message || 'Доктор подключился к разговору',
                isUser: false,
                timestamp: new Date(),
                participantSid: participant.sid,
              });
            }
          } catch (e) {
            // Invalid metadata, ignore
          }
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        removeParticipant(participant.sid);
      });

      // Handle audio track subscription - агент публикует аудио трек
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, track.kind === Track.Kind.Audio ? 'audio' : 'video', 'from', participant.identity);

        if (track.kind === Track.Kind.Audio && participant instanceof RemoteParticipant) {
          // Создаем audio элемент для воспроизведения трека агента
          const audioElement = document.createElement('audio');
          audioElement.setAttribute('data-participant-id', participant.identity);
          audioElement.autoplay = true;
          audioElement.playsInline = true;
          
          // Прикрепляем трек к audio элементу
          track.attach(audioElement);
          
          // Добавляем в DOM (скрыто) для воспроизведения
          audioElement.style.display = 'none';
          document.body.appendChild(audioElement);
          
          console.log('Audio track attached for participant:', participant.identity);
        }

        // Обработка видео треков (если понадобится)
        if (track.kind === Track.Kind.Video && participant instanceof RemoteParticipant) {
          console.log('Video track available from:', participant.identity);
          // Можно обработать видео трек для отображения видео агента
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
        
        // Находим и удаляем audio элемент
        if (track.kind === Track.Kind.Audio) {
          const audioElement = document.querySelector(`audio[data-participant-id="${participant.identity}"]`);
          if (audioElement) {
            track.detach(audioElement);
            audioElement.remove();
          }
        } else {
          track.detach();
        }
      });

      // Обработка изменений состояния публикации треков
      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log('Track published:', publication.kind, 'by', participant.identity);
        
        if (publication.kind === Track.Kind.Audio) {
          console.log('Audio track is now available from:', participant.identity);
        }
      });

      room.on(RoomEvent.TrackUnpublished, (publication, participant) => {
        console.log('Track unpublished:', publication.kind, 'by', participant.identity);
      });

      // Обработка изменений muted/unmuted состояния
      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        console.log('Track muted:', publication.kind, participant.identity);
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        console.log('Track unmuted:', publication.kind, participant.identity);
      });

      room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        if (participant instanceof RemoteParticipant) {
          try {
            const decoder = new TextDecoder();
            const data = JSON.parse(decoder.decode(payload));

            if (data.type === 'chat') {
              addMessage({
                id: data.id || `msg-${Date.now()}-${Math.random()}`,
                text: data.text,
                isUser: false,
                timestamp: new Date(data.timestamp || Date.now()),
                participantSid: participant.sid,
              });
            }
          } catch (e) {
            console.error('Failed to parse data message:', e);
          }
        }
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('Connection state changed:', state);
        if (state === 'disconnected') {
          setConnected(false);
        }
      });

      room.on(RoomEvent.RoomMetadataChanged, (metadata) => {
        console.log('Room metadata changed:', metadata);
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        console.error('Media devices error:', error);
        setError(error.message);
        onError?.(error);
      });

      // Connect to room
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';
      if (!livekitUrl) {
        throw new Error('NEXT_PUBLIC_LIVEKIT_URL is not configured');
      }
      await room.connect(livekitUrl, token);

      roomRef.current = room;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      const err = error instanceof Error ? error : new Error('Unknown error');
      setError(err.message);
      onError?.(err);
      throw err;
    }
  }, [roomName, token, setRoom, setLocalParticipant, addParticipant, removeParticipant, setConnected, setError, addMessage, onConnected, onDisconnected, onError]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect(true);
      roomRef.current = null;
    }
  }, []);

  const publishAudio = useCallback(async (enabled: boolean) => {
    if (!roomRef.current?.localParticipant) return;

    try {
      if (enabled) {
        // Включаем микрофон и публикуем аудио трек
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        console.log('Microphone enabled and audio track publishing');
      } else {
        // Выключаем микрофон (трек остается опубликованным, но muted)
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        console.log('Microphone disabled (muted)');
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      throw error;
    }
  }, []);

  const sendData = useCallback(async (data: object, reliable: boolean = true) => {
    if (!roomRef.current?.localParticipant) return;

    const encoder = new TextEncoder();
    const payload = encoder.encode(JSON.stringify(data));
    await roomRef.current.localParticipant.publishData(payload, { reliable });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    publishAudio,
    sendData,
    room: roomRef.current,
  };
}
