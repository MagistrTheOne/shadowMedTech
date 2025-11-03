import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { egressService } from '@/lib/livekit/egress-client';

const getInfoSchema = z.object({
  egressId: z.string().min(1, 'Egress ID is required'),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin', 'trainer', 'manager', 'rep']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const egressId = searchParams.get('egressId');

    if (!egressId) {
      return NextResponse.json({ error: 'Egress ID is required' }, { status: 400 });
    }

    const validatedData = getInfoSchema.parse({ egressId });

    const recordingInfo = await egressService.getRecordingInfo(validatedData.egressId);

    if (!recordingInfo) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json({
      egressId: recordingInfo.egressId,
      roomId: recordingInfo.roomId,
      roomName: recordingInfo.roomName,
      status: recordingInfo.status,
      startedAt: recordingInfo.startedAt,
      endedAt: recordingInfo.endedAt,
      error: recordingInfo.error,
      file: recordingInfo.file,
      stream: recordingInfo.stream,
      segments: recordingInfo.segments,
    });

  } catch (error) {
    console.error('Get recording info error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get recording info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
