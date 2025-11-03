import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { scenarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['rep', 'trainer', 'manager']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const activeScenarios = await db
      .select({
        id: scenarios.id,
        title: scenarios.title,
        description: scenarios.description,
        difficultyLevel: scenarios.difficultyLevel,
        category: scenarios.category,
        estimatedDuration: scenarios.estimatedDuration,
        learningObjectives: scenarios.learningObjectives,
      })
      .from(scenarios)
      .where(eq(scenarios.isActive, true))
      .orderBy(scenarios.title);

    return NextResponse.json({ scenarios: activeScenarios });
  } catch (error) {
    console.error('Get scenarios error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}
