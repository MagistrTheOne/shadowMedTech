import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { evaluations, visits, scenarios, doctors } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['rep', 'trainer', 'manager']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get evaluations for user's visits
    const userEvaluations = await db
      .select({
        id: evaluations.id,
        score: evaluations.score,
        feedbackText: evaluations.feedbackText,
        recommendations: evaluations.recommendations,
        metricsJson: evaluations.metricsJson,
        createdAt: evaluations.createdAt,
        visit: {
          id: visits.id,
          scenario: {
            title: scenarios.title,
          },
          doctor: {
            name: doctors.name,
          },
        },
      })
      .from(evaluations)
      .leftJoin(visits, eq(evaluations.visitId, visits.id))
      .leftJoin(scenarios, eq(visits.scenarioId, scenarios.id))
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
      .where(eq(visits.userId, user.id))
      .orderBy(desc(evaluations.createdAt));

    return NextResponse.json({
      evaluations: userEvaluations.map(eval => ({
        id: eval.id,
        score: eval.score,
        feedback: eval.feedbackText,
        recommendations: eval.recommendations,
        metrics: eval.metricsJson,
        createdAt: eval.createdAt,
        visit: eval.visit,
      }))
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
