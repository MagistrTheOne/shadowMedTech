import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, mockTranscribeAudio, isSTTAvailable } from '@/lib/stt-tts/stt';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'ru';

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    let result;

    // Use real STT if available, otherwise mock
    if (isSTTAvailable()) {
      result = await transcribeAudio(audioBuffer, language);
    } else {
      console.log('Using mock STT service');
      result = await mockTranscribeAudio(audioBuffer, language);
    }

    return NextResponse.json({
      text: result.text,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
      mock: !isSTTAvailable(),
    });

  } catch (error) {
    console.error('STT API Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
