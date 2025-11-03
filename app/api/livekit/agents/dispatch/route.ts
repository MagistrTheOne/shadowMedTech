import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

/**
 * Dispatch agent to a room (for LiveKit Cloud automatic dispatch)
 * When using LiveKit Cloud, agents are automatically dispatched when participants join.
 * This endpoint ensures the room exists and is ready for agent dispatch.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { roomName, visitId } = await request.json();

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // Create or get room
    // LiveKit Cloud will automatically dispatch agent when participant joins
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60, // 10 minutes
      maxParticipants: 2, // Rep + Agent
      metadata: JSON.stringify({
        visitId,
        agentRequired: true,
      }),
    });

    return NextResponse.json({
      message: 'Room created. Agent will be dispatched automatically when participant joins.',
      room: {
        name: room.name,
        sid: room.sid,
      },
    });

  } catch (error) {
    console.error('Dispatch agent error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch agent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

