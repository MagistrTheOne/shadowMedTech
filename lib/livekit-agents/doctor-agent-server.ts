import { RoomServiceClient, AccessToken, Room, Participant } from 'livekit-server-sdk';
import { gigaChatClient } from '@/lib/gigachat/client';
import { db } from '@/lib/db';
import { visitMessages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

interface DoctorAgentConfig {
  visitId: string;
  doctorId: string;
  doctorName: string;
  personalityType: string;
  promptTemplate: string;
  roomName: string;
  empathyLevel: number;
}

export class DoctorAgentServer {
  private config: DoctorAgentConfig;
  private roomService: RoomServiceClient;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private isActive: boolean = false;

  constructor(config: DoctorAgentConfig) {
    this.config = config;
    this.roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  }

  async start(): Promise<void> {
    if (this.isActive) {
      console.log('Agent already active');
      return;
    }

    try {
      // Generate token for agent
      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: `agent-${this.config.doctorId}`,
        metadata: JSON.stringify({
          name: this.config.doctorName,
          role: 'doctor',
          type: 'ai',
          visitId: this.config.visitId,
        }),
      });

      token.addGrant({
        roomJoin: true,
        room: this.config.roomName,
        canPublish: true,
        canSubscribe: true,
      });

      const tokenJwt = token.toJwt();

      // Note: For a full agent implementation, you would use LiveKit Agents Framework (Python)
      // or AgentsJS (JavaScript) to create a programmatic participant that can:
      // 1. Join the room as a participant
      // 2. Subscribe to audio tracks from the rep
      // 3. Use STT to transcribe audio
      // 4. Generate responses using GigaChat
      // 5. Use TTS to synthesize speech
      // 6. Publish audio tracks back to the room

      // For now, we'll set up the infrastructure and mark agent as active
      // The actual agent logic would run in a separate process/worker
      // that connects to LiveKit using the Agents Framework

      this.isActive = true;
      console.log(`Doctor agent ${this.config.doctorName} started for room ${this.config.roomName}`);

      // In production, you would:
      // 1. Spawn a worker process that uses LiveKit Agents Framework
      // 2. Or use a separate microservice that handles agent logic
      // 3. Store agent state in Redis/database for persistence

    } catch (error) {
      console.error('Failed to start doctor agent:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log(`Doctor agent ${this.config.doctorName} stopped`);
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Prepare prompt for GigaChat
    const prompt = `${this.config.promptTemplate}

Ты - доктор ${this.config.doctorName}. Веди профессиональную беседу с медицинским представителем.
Отвечай на русском языке, будь вежливым но требовательным к деталям.
Фокусируйся на медицинских аспектах препаратов и лечения.

Уровень эмпатии: ${this.config.empathyLevel}/10
Тип личности: ${this.config.personalityType}

Контекст разговора:
${this.conversationHistory.slice(-10).map(msg =>
  `${msg.role === 'user' ? 'Представитель' : 'Доктор'}: ${msg.content}`
).join('\n\n')}

Новое сообщение представителя: ${userMessage}

Дай профессиональный медицинский ответ.`;

    try {
      // Convert conversation history to GigaChat format
      const gigaChatMessages = this.conversationHistory.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const response = await gigaChatClient.sendMessage([
        {
          role: 'system',
          content: prompt,
        },
        ...gigaChatMessages.slice(-10),
        {
          role: 'user',
          content: userMessage,
        },
      ]);

      const aiResponse = response.choices[0]?.message?.content || 'Я слушаю вас внимательно.';

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Save message to database
      await db.insert(visitMessages).values({
        visitId: this.config.visitId,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          source: 'livekit-agent',
          doctorId: this.config.doctorId,
        },
      });

      return aiResponse;
    } catch (error) {
      console.error('GigaChat response error:', error);
      throw error;
    }
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
