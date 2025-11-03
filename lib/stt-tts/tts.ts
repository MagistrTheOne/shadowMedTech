import OpenAI from 'openai';

// Initialize OpenAI client for TTS
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TTSResult {
  audioBuffer: ArrayBuffer;
  duration: number;
  format: string;
}

/**
 * Generates speech from text using OpenAI TTS API
 * @param text - Text to convert to speech
 * @param voice - Voice to use ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
 * @param language - Language code (affects voice selection)
 * @returns Promise<TTSResult>
 */
export async function generateSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
  language: string = 'ru'
): Promise<TTSResult> {
  try {
    // Map language to appropriate voice for better pronunciation
    let selectedVoice = voice;
    if (language === 'ru') {
      // Use voices that work well with Russian
      selectedVoice = voice === 'alloy' ? 'alloy' : voice === 'nova' ? 'nova' : 'alloy';
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: text,
      response_format: 'mp3',
      speed: 1.0,
    });

    const buffer = await mp3.arrayBuffer();

    // Estimate duration based on text length (rough approximation)
    const estimatedDuration = Math.max(1, text.length / 15); // ~15 chars per second

    return {
      audioBuffer: buffer,
      duration: estimatedDuration,
      format: 'mp3',
    };
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error('Failed to generate speech');
  }
}

/**
 * Mock TTS for development/testing
 * @param text - Text to convert (ignored in mock)
 * @param voice - Voice name
 * @param language - Language code
 * @returns Promise<TTSResult>
 */
export async function mockGenerateSpeech(
  text: string,
  voice: string = 'alloy',
  language: string = 'ru'
): Promise<TTSResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

  // Create a simple mock audio buffer (silence)
  const sampleRate = 44100;
  const duration = Math.max(1, text.length / 15); // Estimate duration
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = new ArrayBuffer(numSamples * 2); // 16-bit samples

  return {
    audioBuffer,
    duration,
    format: 'wav',
  };
}

/**
 * Check if TTS service is available
 * @returns boolean
 */
export function isTTSAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get available voices for a language
 * @param language - Language code
 * @returns Array of voice names
 */
export function getAvailableVoices(language: string = 'ru'): string[] {
  // OpenAI TTS voices that work well with different languages
  const voiceMap: Record<string, string[]> = {
    'ru': ['alloy', 'nova', 'shimmer'], // Voices with good Russian support
    'en': ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    'es': ['alloy', 'nova', 'shimmer'],
    'fr': ['alloy', 'nova', 'onyx'],
    'de': ['alloy', 'nova', 'onyx'],
  };

  return voiceMap[language] || voiceMap['en'];
}
