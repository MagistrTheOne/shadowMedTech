import { readFileSync } from 'fs';
import { join } from 'path';

interface GigaChatConfig {
  clientId: string;
  clientSecret: string;
  authorizationKey: string;
  oauthUrl: string;
  apiUrl: string;
  scope: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GigaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GigaChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GigaChatClient {
  private config: GigaChatConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private httpsAgent: any;

  constructor() {
    this.config = {
      clientId: process.env.GIGACHAT_CLIENT_ID!,
      clientSecret: process.env.GIGACHAT_CLIENT_SECRET!,
      authorizationKey: process.env.GIGACHAT_AUTHORIZATION_KEY!,
      oauthUrl: process.env.GIGACHAT_OAUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      apiUrl: process.env.GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1',
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
    };

    // Load SSL certificate for MinTsifry
    try {
      const certPath = join(process.cwd(), 'lib', 'certs', 'russian_trusted_root_ca_pem.crt');
      const caCert = readFileSync(certPath);

      // For Node.js 18+ fetch API
      this.httpsAgent = {
        ca: caCert,
        rejectUnauthorized: true,
      };
    } catch (error) {
      console.warn('SSL certificate not found, using default HTTPS agent:', error);
      this.httpsAgent = {};
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    const authString = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(this.config.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
        'RqUID': crypto.randomUUID(),
      },
      body: new URLSearchParams({
        scope: this.config.scope,
      }),
      // @ts-ignore - Node.js fetch agent
      agent: this.httpsAgent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data: AccessTokenResponse = await response.json();

    // Token expires in 30 minutes, set expiry to 25 minutes for safety
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (25 * 60 * 1000));

    return this.accessToken;
  }

  async sendMessage(
    messages: GigaChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    } = {}
  ): Promise<GigaChatResponse> {
    const token = await this.getAccessToken();

    const {
      model = 'GigaChat',
      temperature = 0.7,
      maxTokens = 1000,
      topP = 1.0,
    } = options;

    const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: false,
      }),
      // @ts-ignore - Node.js fetch agent
      agent: this.httpsAgent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GigaChat API error: ${response.status} ${errorText}`);
    }

    const data: GigaChatResponse = await response.json();
    return data;
  }

  async generateDoctorResponse(
    systemPrompt: string,
    conversationHistory: GigaChatMessage[],
    userMessage: string,
    personalityTraits: {
      empathyLevel: number;
      personalityType: string;
    }
  ): Promise<string> {
    const messages: GigaChatMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}

        Your personality traits:
        - Empathy level: ${personalityTraits.empathyLevel}/10
        - Personality type: ${personalityTraits.personalityType}

        Respond as a medical professional in a pharmaceutical sales conversation.
        Be realistic, professional, and maintain your personality throughout the interaction.`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await this.sendMessage(messages, {
      model: 'GigaChat',
      temperature: 0.8, // More creative for natural conversation
      maxTokens: 500,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I cannot respond at this moment.';
  }

  async evaluateVisit(
    visitTranscript: string,
    evaluationCriteria: string[]
  ): Promise<{
    score: number;
    feedback: string;
    recommendations: string[];
    metrics: Record<string, any>;
  }> {
    const evaluationPrompt = `
    You are an expert medical training evaluator. Analyze the following pharmaceutical sales visit transcript and provide:

    1. Overall score (0-100)
    2. Detailed feedback on performance
    3. Specific recommendations for improvement
    4. Metrics breakdown by evaluation criteria

    Evaluation Criteria:
    ${evaluationCriteria.join('\n')}

    Transcript:
    ${visitTranscript}

    Provide your response in JSON format with keys: score, feedback, recommendations (array), metrics (object)
    `;

    const messages: GigaChatMessage[] = [
      {
        role: 'system',
        content: 'You are a medical training evaluation expert. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: evaluationPrompt,
      },
    ];

    const response = await this.sendMessage(messages, {
      model: 'GigaChat',
      temperature: 0.3, // More deterministic for evaluation
      maxTokens: 1000,
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        score: Math.max(0, Math.min(100, result.score || 0)),
        feedback: result.feedback || 'Evaluation completed',
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        metrics: result.metrics || {},
      };
    } catch (error) {
      // Fallback evaluation if JSON parsing fails
      return {
        score: 70,
        feedback: 'Visit evaluation completed. Some technical issues occurred during detailed analysis.',
        recommendations: ['Continue practicing pharmaceutical sales conversations', 'Focus on building rapport with healthcare professionals'],
        metrics: { technical_error: true },
      };
    }
  }

  async getModels(): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // @ts-ignore - Node.js fetch agent
      agent: this.httpsAgent,
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance
export const gigaChatClient = new GigaChatClient();
