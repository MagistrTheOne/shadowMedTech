import { gigaChatClient } from '@/lib/gigachat/client';

export interface DoctorAgentConfig {
  doctorId: string;
  doctorName: string;
  personalityType: string;
  promptTemplate: string;
  roomName: string;
}

export class DoctorAgent {
  private config: DoctorAgentConfig;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  private isConnected: boolean = false;

  constructor(config: DoctorAgentConfig) {
    this.config = config;
  }


  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Prepare conversation context for GigaChat
      const context = this.conversationHistory.slice(-10).map(msg =>
        `${msg.role === 'user' ? 'Пациент/Представитель' : 'Доктор'}: ${msg.content}`
      ).join('\n\n');

      const prompt = `Ты - доктор ${this.config.doctorName}.
      ${this.config.promptTemplate}

      Контекст предыдущего разговора:
      ${context}

      Новое сообщение представителя: ${userMessage}

      Дай профессиональный медицинский ответ. Будь полезным и информативным.`;

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
        ...gigaChatMessages.slice(-10), // Last 10 messages for context
        {
          role: 'user',
          content: userMessage,
        },
      ]);

      const aiResponse = response.choices[0]?.message?.content || 'Я слушаю вас внимательно.';

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      return aiResponse;

    } catch (error) {
      console.error('GigaChat response error:', error);

      // Fallback responses based on doctor personality
      const fallbacks = {
        demanding: [
          'Будьте более конкретны в своих вопросах.',
          'Мне нужны детали о препарате.',
          'Какова дозировка и показания к применению?'
        ],
        rational: [
          'Давайте разберем это логически.',
          'Какие есть доказательства эффективности?',
          'Нужны клинические данные.'
        ],
        empathetic: [
          'Я понимаю вашу озабоченность.',
          'Расскажите подробнее о ситуации.',
          'Как я могу вам помочь?'
        ]
      };

      const personalityFallbacks = fallbacks[this.config.personalityType as keyof typeof fallbacks] || fallbacks.rational;
      return personalityFallbacks[Math.floor(Math.random() * personalityFallbacks.length)];
    }
  }

  async joinRoom(token: string) {
    // TODO: Integrate with LiveKit Agents SDK
    // For now, just mark as connected
    this.isConnected = true;
    console.log(`Doctor agent ${this.config.doctorName} ready for room ${this.config.roomName}`);
  }

  async leaveRoom() {
    this.isConnected = false;
    console.log(`Doctor agent ${this.config.doctorName} left room`);
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Factory function to create doctor agents
export function createDoctorAgent(config: DoctorAgentConfig): DoctorAgent {
  return new DoctorAgent(config);
}
