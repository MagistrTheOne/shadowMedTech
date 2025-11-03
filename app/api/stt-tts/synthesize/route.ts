import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech, mockGenerateSpeech, isTTSAvailable } from '@/lib/stt-tts/tts';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy', language = 'ru' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 4000) {
      return NextResponse.json({ error: 'Text too long (max 4000 characters)' }, { status: 400 });
    }

    let result;

    // Use real TTS if available, otherwise mock
    if (isTTSAvailable()) {
      result = await generateSpeech(text, voice as any, language);
    } else {
      console.log('Using mock TTS service');
      result = await mockGenerateSpeech(text, voice, language);
    }

    // Return audio data
    return new NextResponse(result.audioBuffer, {
      headers: {
        'Content-Type': `audio/${result.format}`,
        'Content-Length': result.audioBuffer.byteLength.toString(),
        'X-Duration': result.duration.toString(),
        'X-Format': result.format,
        'X-Mock': (!isTTSAvailable()).toString(),
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
