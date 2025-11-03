import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { egressService } from '@/lib/livekit/egress-client';
import { db } from '@/lib/db';
import { visits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const startRecordingSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  audioOnly: z.boolean().optional().default(false),
  layout: z.string().optional().default('speaker'),
  preset: z.enum(['H264_720P_30', 'H264_720P_60', 'H264_1080P_30', 'H264_1080P_60']).optional(),
  s3: z.object({
    accessKey: z.string(),
    secret: z.string(),
    bucket: z.string(),
    region: z.string(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin', 'trainer', 'manager', 'rep']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const validatedData = startRecordingSchema.parse(body);

    // Get visit to verify room name and permissions
    const [visit] = await db
      .select({
        id: visits.id,
        livekitRoomName: visits.livekitRoomName,
        userId: visits.userId,
        status: visits.status,
        egressId: visits.egressId,
      })
      .from(visits)
      .where(eq(visits.id, validatedData.visitId))
      .limit(1);

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Check if visit belongs to user or user is admin/trainer/manager
    const { user } = authResult;
    if (user.role !== 'admin' && user.role !== 'trainer' && user.role !== 'manager' && visit.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!visit.livekitRoomName) {
      return NextResponse.json({ error: 'Visit has no LiveKit room' }, { status: 400 });
    }

    // Check if recording already exists
    if (visit.egressId) {
      return NextResponse.json(
        { error: 'Recording already started for this visit', egressId: visit.egressId },
        { status: 409 }
      );
    }

    // Start recording
    let recordingInfo;
    if (validatedData.audioOnly) {
      recordingInfo = await egressService.startAudioRecording(visit.livekitRoomName, {
        filepath: `visit-${validatedData.visitId}-${Date.now()}.mp4`,
        s3: validatedData.s3,
      });
    } else {
      recordingInfo = await egressService.startRoomRecording(visit.livekitRoomName, {
        layout: validatedData.layout,
        filepath: `visit-${validatedData.visitId}-${Date.now()}.mp4`,
        preset: validatedData.preset,
        s3: validatedData.s3,
      });
    }

    // Save egress ID to visit
    await db
      .update(visits)
      .set({ egressId: recordingInfo.egressId })
      .where(eq(visits.id, validatedData.visitId));

    return NextResponse.json({
      message: 'Recording started successfully',
      egressId: recordingInfo.egressId,
      status: recordingInfo.status,
      roomName: visit.livekitRoomName,
    }, { status: 201 });

  } catch (error) {
    console.error('Start recording error:', error);

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
      { error: 'Failed to start recording', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
