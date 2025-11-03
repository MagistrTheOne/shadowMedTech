import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/require-auth';
import { egressService } from '@/lib/livekit/egress-client';
import { db } from '@/lib/db';
import { visits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const stopRecordingSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID').optional(),
  egressId: z.string().optional(),
}).refine(data => data.visitId || data.egressId, {
  message: 'Either visitId or egressId must be provided',
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin', 'trainer', 'manager', 'rep']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const validatedData = stopRecordingSchema.parse(body);

    let egressId = validatedData.egressId;

    // If visitId provided, get egressId from visit
    if (validatedData.visitId && !egressId) {
      const [visit] = await db
        .select({
          id: visits.id,
          userId: visits.userId,
          egressId: visits.egressId,
        })
        .from(visits)
        .where(eq(visits.id, validatedData.visitId))
        .limit(1);

      if (!visit) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }

      // Check permissions
      const { user } = authResult;
      if (user.role !== 'admin' && user.role !== 'trainer' && user.role !== 'manager' && visit.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      if (!visit.egressId) {
        return NextResponse.json({ error: 'No active recording for this visit' }, { status: 404 });
      }

      egressId = visit.egressId;
    }

    if (!egressId) {
      return NextResponse.json({ error: 'Egress ID not found' }, { status: 400 });
    }

    // Stop recording
    const recordingInfo = await egressService.stopRecording(egressId);

    // Clear egressId from visit if visitId was provided
    if (validatedData.visitId) {
      await db
        .update(visits)
        .set({ egressId: null })
        .where(eq(visits.id, validatedData.visitId));
    }

    return NextResponse.json({
      message: 'Recording stopped successfully',
      egressId: recordingInfo.egressId,
      status: recordingInfo.status,
    });

  } catch (error) {
    console.error('Stop recording error:', error);

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
      { error: 'Failed to stop recording', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
