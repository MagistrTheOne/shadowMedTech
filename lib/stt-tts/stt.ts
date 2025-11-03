import OpenAI from 'openai';

// Initialize OpenAI client for Whisper
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

/**
 * Transcribes audio using OpenAI Whisper API
 * @param audioBuffer - Audio data as Buffer or Uint8Array
 * @param language - Optional language code (e.g., 'ru', 'en')
 * @returns Promise<TranscriptionResult>
 */
export async function transcribeAudio(
  audioBuffer: Buffer | Uint8Array,
  language?: string
): Promise<TranscriptionResult> {
  try {
    // Convert to File-like object for OpenAI API
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || 'ru', // Default to Russian
      response_format: 'json',
      temperature: 0,
    });

    return {
      text: transcription.text.trim(),
      confidence: 0.95, // OpenAI doesn't provide confidence scores
      language: language || 'ru',
      duration: 0, // Would need to calculate from audio metadata
    };
  } catch (error) {
    console.error('STT Error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Mock transcription for development/testing
 * @param audioBuffer - Audio data (ignored in mock)
 * @param language - Language code
 * @returns Promise<TranscriptionResult>
 */
export async function mockTranscribeAudio(
  audioBuffer: Buffer | Uint8Array,
  language: string = 'ru'
): Promise<TranscriptionResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const mockTexts = [
    'Здравствуйте, доктор. Я пришел обсудить новый препарат для лечения гипертонии.',
    'У пациента наблюдается повышенное давление. Какие побочные эффекты у этого лекарства?',
    'Можно ли назначить этот препарат вместе с текущей терапией?',
    'Какова эффективность данного лекарства по сравнению с аналогами?',
    'Какие противопоказания у этого препарата?',
    'Сколько времени занимает курс лечения?',
    'Какие анализы нужно сдать перед назначением?',
    'Есть ли более дешевые аналоги этого препарата?',
    'Как правильно принимать это лекарство?',
    'Что делать при пропуске приема препарата?',
  ];

  const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

  return {
    text: randomText,
    confidence: 0.85 + Math.random() * 0.1, // Random confidence 0.85-0.95
    language,
    duration: 2 + Math.random() * 3, // Random duration 2-5 seconds
  };
}

/**
 * Check if STT service is available
 * @returns boolean
 */
export function isSTTAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
