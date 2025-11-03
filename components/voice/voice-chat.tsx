"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  roomName: string;
  livekitToken: string;
  doctorName: string;
  doctorAvatar?: string;
  visitId?: string;
  onTranscription?: (text: string, isUser: boolean) => void;
  onEndVisit?: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function VoiceChat({
  roomName,
  livekitToken,
  doctorName,
  doctorAvatar,
  visitId,
  onTranscription,
  onEndVisit
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Save message to database
  const saveMessage = async (text: string, isUser: boolean) => {
    if (!visitId) return;

    try {
      const response = await fetch(`/api/visits/${visitId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: isUser ? 'user' : 'assistant',
          content: text,
          metadata: {
            source: isUser ? 'stt' : 'tts',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load previous messages
  const loadMessages = async () => {
    if (!visitId) return;

    try {
      const response = await fetch(`/api/visits/${visitId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');

      const data = await response.json();
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Не удалось загрузить предыдущие сообщения');
    }
  };

  // Initialize LiveKit connection (simplified for now)
  useEffect(() => {
    if (livekitToken && roomName) {
      // TODO: Initialize LiveKit Room connection
      setIsConnected(true);
      loadMessages();
    }
  }, [livekitToken, roomName, visitId]);

  // Start recording
  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Ошибка записи аудио');
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Доступ к микрофону запрещен. Разрешите доступ в браузере.');
        } else if (error.name === 'NotFoundError') {
          setError('Микрофон не найден.');
        } else {
          setError('Ошибка доступа к микрофону: ' + error.message);
        }
      }
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setCurrentTranscription('Обработка...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/stt-tts/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('STT failed');
      }

      const result = await response.json();

      const transcription = result.text;
      setCurrentTranscription('');

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: transcription,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      await saveMessage(transcription, true);
      onTranscription?.(transcription, true);

      // Simulate doctor response (in real app, this would come from LiveKit/WebSocket)
      setTimeout(() => {
        generateDoctorResponse(transcription);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      console.error('Audio processing error:', error);
      setCurrentTranscription('Ошибка распознавания речи');
      setTimeout(() => setCurrentTranscription(''), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate AI doctor response
  const generateDoctorResponse = async (userText: string) => {
    try {
      const response = await fetch('/api/stt-tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Доктор ${doctorName}: Отвечаю на ваш вопрос о "${userText.substring(0, 50)}..."`,
          voice: 'nova',
          language: 'ru'
        }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      // Play audio (simplified)
      const audioBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBufferSource = audioContext.createBufferSource();
      audioBufferSource.buffer = await audioContext.decodeAudioData(audioBuffer);
      audioBufferSource.connect(audioContext.destination);
      audioBufferSource.start();

      // Add doctor message
      const doctorMessage: Message = {
        id: `doctor-${Date.now()}`,
        text: `Доктор ${doctorName}: Отвечаю на ваш вопрос...`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, doctorMessage]);
      await saveMessage(doctorMessage.text, false);
      onTranscription?.(doctorMessage.text, false);

    } catch (error) {
      console.error('Doctor response error:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // End visit
  const endVisit = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsConnected(false);
    onEndVisit?.();
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 glass-card m-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {doctorAvatar ? (
                <img src={doctorAvatar} alt={doctorName} className="w-full h-full rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {doctorName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Визит к {doctorName}</h2>
            <p className="text-slate-300 text-sm">
              {isConnected ? 'Подключено' : 'Подключение...'}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={endVisit}
          className="flex items-center space-x-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Завершить</span>
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <Card className="h-full glass-card">
          <CardHeader>
            <CardTitle className="text-white">Диалог</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                      message.isUser
                        ? "bg-primary text-white"
                        : "glass-input text-white"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Current transcription */}
              {currentTranscription && (
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-primary/50 text-white animate-pulse">
                    <p className="text-sm italic">{currentTranscription}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm">Идет запись...</span>
              </div>
            )}

            {/* Error indicator */}
            {error && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full"
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>

              <Button
                variant={isMuted ? "secondary" : "outline"}
                size="lg"
                onClick={toggleMute}
                className="w-16 h-16 rounded-full"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
