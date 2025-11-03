"use client";

import { useEffect, useRef, useState } from "react";
import { Room, Track, RemoteParticipant } from "livekit-client";

interface AudioVisualizerProps {
  room: Room | null;
  participantIdentity?: string;
  className?: string;
}

export function AudioVisualizer({ room, participantIdentity, className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!room || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupAudioAnalysis = async () => {
      try {
        // Найти аудио трек участника (агента)
        const participants = participantIdentity
          ? [room.getParticipantByIdentity(participantIdentity)]
          : Array.from(room.remoteParticipants.values());

        for (const participant of participants) {
          if (!participant || participant instanceof RemoteParticipant === false) continue;
          const remoteParticipant = participant as RemoteParticipant;

          for (const publication of remoteParticipant.audioTrackPublications.values()) {
            if (publication.track && publication.isSubscribed && !publication.isMuted) {
              try {
                // Создаем AudioContext
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
                
                // Получаем MediaStreamTrack из трека
                const mediaStreamTrack = publication.track.mediaStreamTrack;
                const mediaStream = new MediaStream([mediaStreamTrack]);
                
                // Создаем источник и анализатор
                const sourceNode = audioContextRef.current.createMediaStreamSource(mediaStream);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                
                sourceNode.connect(analyserRef.current);
                setIsActive(true);

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

                const draw = () => {
                  if (!analyserRef.current || !ctx || !isActive) {
                    animationRef.current = undefined;
                    return;
                  }

                  animationRef.current = requestAnimationFrame(draw);
                  analyserRef.current.getByteFrequencyData(dataArray);

                  // Очистка canvas
                  ctx.fillStyle = "rgba(15, 23, 42, 0.8)"; // slate-900 с прозрачностью
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  // Рисуем бары
                  const barWidth = (canvas.width / dataArray.length) * 2.5;
                  let x = 0;

                  for (let i = 0; i < dataArray.length; i++) {
                    const barHeight = (dataArray[i] / 255) * canvas.height;

                    // Градиент для визуализации
                    const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                    gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)"); // blue-500
                    gradient.addColorStop(1, "rgba(147, 197, 253, 0.4)"); // blue-300

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

                    x += barWidth;
                  }
                };

                draw();
                return; // Использовали первый найденный трек
              } catch (error) {
                console.error("Failed to setup audio analysis:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to setup audio visualization:", error);
      }
    };

    // Установка анализа при подключении
    if (room.state === "connected") {
      setupAudioAnalysis();
    }

    // Слушаем события для обновления при появлении треков
    const handleTrackSubscribed = () => {
      setupAudioAnalysis();
    };

    room.on("trackSubscribed", handleTrackSubscribed);

    return () => {
      room.off("trackSubscribed", handleTrackSubscribed);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      setIsActive(false);
    };
  }, [room, participantIdentity]);

  if (!isActive) {
    return (
      <div className={`flex items-center justify-center h-20 bg-slate-900/50 rounded ${className}`}>
        <span className="text-xs text-gray-500">Waiting for audio...</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      className={className}
    />
  );
}
