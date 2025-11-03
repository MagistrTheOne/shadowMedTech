import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { visits } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/require-auth';
import { egressService } from '@/lib/livekit/egress-client';
import { eq, and } from 'drizzle-orm';

const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const visitId = params.id;
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Get current visit state
    const [visit] = await db
      .select({
        id: visits.id,
        userId: visits.userId,
        status: visits.status,
        livekitRoomName: visits.livekitRoomName,
        egressId: visits.egressId,
        startedAt: visits.startedAt,
      })
      .from(visits)
      .where(and(
        eq(visits.id, visitId),
        eq(visits.userId, user.id)
      ))
      .limit(1);

    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found or access denied' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status: validatedData.status,
      updatedAt: new Date(),
    };

    // Handle status transitions and recording
    if (validatedData.status === 'in_progress' && visit.status !== 'in_progress') {
      // Start recording when visit begins
      updateData.startedAt = new Date();

      if (visit.livekitRoomName && !visit.egressId) {
        try {
          // Start audio-only recording by default
          const recordingInfo = await egressService.startAudioRecording(
            visit.livekitRoomName,
            {
              filepath: `visit-${visitId}-${Date.now()}.mp4`,
            }
          );
          updateData.egressId = recordingInfo.egressId;
          console.log(`Recording started for visit ${visitId}: ${recordingInfo.egressId}`);
        } catch (recordingError) {
          console.error('Failed to start recording:', recordingError);
          // Continue without recording if it fails
        }
      }
    } else if (validatedData.status === 'completed' && visit.status !== 'completed') {
      // Stop recording when visit completes
      updateData.completedAt = new Date();

      if (visit.startedAt) {
        const duration = Math.floor((new Date().getTime() - visit.startedAt.getTime()) / 1000);
        updateData.duration = duration;
      }

      if (visit.egressId) {
        try {
          await egressService.stopRecording(visit.egressId);
          console.log(`Recording stopped for visit ${visitId}: ${visit.egressId}`);
          // Keep egressId for reference, don't clear it
        } catch (recordingError) {
          console.error('Failed to stop recording:', recordingError);
          // Continue even if stopping recording fails
        }
      }
    }

    // Update visit
    const [updatedVisit] = await db
      .update(visits)
      .set(updateData)
      .where(eq(visits.id, visitId))
      .returning();

    return NextResponse.json({
      message: 'Visit status updated successfully',
      visit: updatedVisit,
    });

  } catch (error) {
    console.error('Update visit status error:', error);

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
      { error: 'Failed to update visit status' },
      { status: 500 }
    );
  }
}
