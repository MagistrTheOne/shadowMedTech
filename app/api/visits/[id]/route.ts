import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visits, scenarios, doctors, users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/require-auth';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const visitId = params.id;

  try {
    // Get visit with related data
    const [visit] = await db
      .select({
        id: visits.id,
        userId: visits.userId,
        status: visits.status,
        livekitRoomName: visits.livekitRoomName,
        egressId: visits.egressId,
        startedAt: visits.startedAt,
        completedAt: visits.completedAt,
        duration: visits.duration,
        createdAt: visits.createdAt,
        scenario: {
          id: scenarios.id,
          title: scenarios.title,
          description: scenarios.description,
          difficultyLevel: scenarios.difficultyLevel,
          promptTemplate: scenarios.promptTemplate,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          personalityType: doctors.personalityType,
          empathyLevel: doctors.empathyLevel,
          promptTemplate: doctors.promptTemplate,
          specialty: doctors.specialty,
        },
      })
      .from(visits)
      .leftJoin(scenarios, eq(visits.scenarioId, scenarios.id))
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found' },
        { status: 404 }
      );
    }

    // Check access: user owns visit OR is admin/trainer/manager
    // For agents, we'll allow access via service token in production
    if (user.role !== 'admin' && user.role !== 'trainer' && user.role !== 'manager' && visit.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ visit });

  } catch (error) {
    console.error('Get visit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visit' },
      { status: 500 }
    );
  }
}

