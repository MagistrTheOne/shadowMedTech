import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { egressService } from '@/lib/livekit/egress-client';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin', 'trainer', 'manager']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName') || undefined;

    const recordings = await egressService.listRecordings(roomName);

    return NextResponse.json({
      recordings: recordings.map(r => ({
        egressId: r.egressId,
        roomId: r.roomId,
        roomName: r.roomName,
        status: r.status,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        error: r.error,
      })),
    });

  } catch (error) {
    console.error('List recordings error:', error);
    return NextResponse.json(
      { error: 'Failed to list recordings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
