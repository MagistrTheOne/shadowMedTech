import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { createRepToken } from '@/lib/livekit/client';

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['rep']);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await request.json();

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const token = createRepToken(roomName, user.id.toString());

    return NextResponse.json({
      token,
      roomName,
      identity: `rep-${user.id}`,
    });
  } catch (error) {
    console.error('Error creating LiveKit token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
