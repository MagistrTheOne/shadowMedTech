import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { visits, scenarios, doctors, users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/require-auth';
import { createRepToken } from '@/lib/livekit/client';
import { eq, desc, and } from 'drizzle-orm';

const createVisitSchema = z.object({
  scenarioId: z.string().uuid('Invalid scenario ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
});

// GET /api/visits - Get user's visits
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get user's visits with related data
    const userVisits = await db
      .select({
        id: visits.id,
        status: visits.status,
        startedAt: visits.startedAt,
        completedAt: visits.completedAt,
        duration: visits.duration,
        createdAt: visits.createdAt,
        scenario: {
          id: scenarios.id,
          title: scenarios.title,
          difficultyLevel: scenarios.difficultyLevel,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          personalityType: doctors.personalityType,
        },
      })
      .from(visits)
      .leftJoin(scenarios, eq(visits.scenarioId, scenarios.id))
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.userId, user.id))
      .orderBy(desc(visits.createdAt));

    return NextResponse.json({ visits: userVisits });
  } catch (error) {
    console.error('Get visits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visits' },
      { status: 500 }
    );
  }
}

// POST /api/visits - Create new visit
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  try {
    const body = await request.json();
    const validatedData = createVisitSchema.parse(body);

    // Verify scenario exists and is active
    const [scenario] = await db
      .select()
      .from(scenarios)
      .where(and(
        eq(scenarios.id, validatedData.scenarioId),
        eq(scenarios.isActive, true)
      ))
      .limit(1);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found or inactive' },
        { status: 404 }
      );
    }

    // Verify doctor exists and is active
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(
        eq(doctors.id, validatedData.doctorId),
        eq(doctors.isActive, true)
      ))
      .limit(1);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found or inactive' },
        { status: 404 }
      );
    }

    // Generate unique room name for LiveKit
    const roomName = `visit-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Create visit
    const [newVisit] = await db
      .insert(visits)
      .values({
        userId: user.id,
        scenarioId: validatedData.scenarioId,
        doctorId: validatedData.doctorId,
        status: 'scheduled',
        livekitRoomName: roomName,
      })
      .returning();

    if (!newVisit) {
      return NextResponse.json(
        { error: 'Failed to create visit' },
        { status: 500 }
      );
    }

    // Generate LiveKit token for the representative
    const livekitToken = createRepToken(roomName, user.id.toString());

    // Return visit with related data
    const [visitWithData] = await db
      .select({
        id: visits.id,
        status: visits.status,
        livekitRoomName: visits.livekitRoomName,
        startedAt: visits.startedAt,
        completedAt: visits.completedAt,
        duration: visits.duration,
        createdAt: visits.createdAt,
        scenario: {
          id: scenarios.id,
          title: scenarios.title,
          difficultyLevel: scenarios.difficultyLevel,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          personalityType: doctors.personalityType,
        },
      })
      .from(visits)
      .leftJoin(scenarios, eq(visits.scenarioId, scenarios.id))
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.id, newVisit.id))
      .limit(1);

    return NextResponse.json({
      message: 'Visit created successfully',
      visit: visitWithData,
      livekitToken,
      roomName,
    }, { status: 201 });

  } catch (error) {
    console.error('Create visit error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
