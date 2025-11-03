import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visits, scenarios, doctors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Special endpoint for agents to get visit data without authentication.
 * Uses service token from environment for security.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitId = params.id;

    // Check service token (optional, but recommended for production)
    const serviceToken = request.headers.get('x-service-token');
    const expectedToken = process.env.AGENT_SERVICE_TOKEN;

    if (expectedToken && serviceToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({ visit });

  } catch (error) {
    console.error('Get visit error (agent):', error);
    return NextResponse.json(
      { error: 'Failed to fetch visit' },
      { status: 500 }
    );
  }
}

