"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextChatProps {
  roomName: string;
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

export function TextChat({
  roomName,
  doctorName,
  doctorAvatar,
  visitId,
  onTranscription,
  onEndVisit
}: TextChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            source: 'text',
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

  // Send message
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    await saveMessage(messageToSend, true);
    onTranscription?.(messageToSend, true);

    // Simulate AI doctor response
    setIsTyping(true);
    setTimeout(async () => {
      await generateDoctorResponse(messageToSend);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  // Generate AI doctor response
  const generateDoctorResponse = async (userText: string) => {
    try {
      // Use GigaChat API for intelligent responses
      const response = await fetch('/api/chat/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          doctorName,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
          visitId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      const aiResponse = data.response;

      const doctorMessage: Message = {
        id: `doctor-${Date.now()}`,
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, doctorMessage]);
      await saveMessage(aiResponse, false);
      onTranscription?.(aiResponse, false);

    } catch (error) {
      console.error('Doctor response error:', error);

      // Fallback response
      const fallbackResponse = `Доктор ${doctorName}: Я внимательно слушаю. Расскажите подробнее о вашем вопросе.`;

      const doctorMessage: Message = {
        id: `doctor-${Date.now()}`,
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, doctorMessage]);
      await saveMessage(fallbackResponse, false);
      onTranscription?.(fallbackResponse, false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [visitId]);

  return (
    <div className="flex flex-col h-full max-h-screen bg-linear-to-br from-black via-gray-900 to-black">
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
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Чат с {doctorName}</h2>
            <p className="text-gray-400 text-sm">Текстовая консультация</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onEndVisit}
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

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg glass-input text-white">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error indicator */}
            {error && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Message Input */}
            <div className="flex items-end space-x-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Введите ваше сообщение..."
                className="flex-1 glass-input resize-none"
                rows={2}
                disabled={isTyping}
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                size="lg"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Hidden element for scrolling */}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
