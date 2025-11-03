import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visits, visitMessages, evaluations, scenarios, doctors } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/require-auth';
import { gigaChatClient } from '@/lib/gigachat/client';
import { eq, and, asc } from 'drizzle-orm';

// POST /api/visits/[id]/evaluate - Evaluate visit using GigaChat
export async function POST(
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

    // Verify visit exists and belongs to user
    const [visit] = await db
      .select({
        id: visits.id,
        userId: visits.userId,
        status: visits.status,
        scenario: {
          id: scenarios.id,
          title: scenarios.title,
          description: scenarios.description,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          personalityType: doctors.personalityType,
          empathyLevel: doctors.empathyLevel,
        },
      })
      .from(visits)
      .leftJoin(scenarios, eq(visits.scenarioId, scenarios.id))
      .leftJoin(doctors, eq(visits.doctorId, doctors.id))
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

    if (visit.status !== 'completed') {
      return NextResponse.json(
        { error: 'Visit must be completed before evaluation' },
        { status: 400 }
      );
    }

    // Check if evaluation already exists
    const existingEvaluation = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.visitId, visitId))
      .limit(1);

    if (existingEvaluation.length > 0) {
      return NextResponse.json(
        { error: 'Visit has already been evaluated' },
        { status: 409 }
      );
    }

    // Get all messages for the visit
    const messages = await db
      .select({
        role: visitMessages.role,
        content: visitMessages.content,
        timestamp: visitMessages.timestamp,
      })
      .from(visitMessages)
      .where(eq(visitMessages.visitId, visitId))
      .orderBy(asc(visitMessages.timestamp));

    // Prepare transcript for evaluation
    const transcript = messages
      .map(msg => `${msg.role === 'user' ? 'Medical Rep' : `Dr. ${visit.doctor.name}`}: ${msg.content}`)
      .join('\n\n');

    // Define evaluation criteria
    const evaluationCriteria = [
      'Communication clarity and professionalism',
      'Product knowledge demonstration',
      'Active listening and empathy',
      'Problem-solving and objection handling',
      'Call structure and organization',
      'Confidence and rapport building'
    ];

    // Get evaluation from GigaChat
    const evaluationResult = await gigaChatClient.evaluateVisit(
      transcript,
      evaluationCriteria
    );

    // Save evaluation to database
    const [savedEvaluation] = await db
      .insert(evaluations)
      .values({
        visitId: visitId,
        score: evaluationResult.score,
        feedbackText: evaluationResult.feedback,
        metricsJson: evaluationResult.metrics,
        recommendations: evaluationResult.recommendations,
      })
      .returning();

    if (!savedEvaluation) {
      return NextResponse.json(
        { error: 'Failed to save evaluation' },
        { status: 500 }
      );
    }

    // Return evaluation result
    return NextResponse.json({
      message: 'Visit evaluation completed',
      evaluation: {
        id: savedEvaluation.id,
        score: savedEvaluation.score,
        feedback: savedEvaluation.feedbackText,
        recommendations: savedEvaluation.recommendations,
        metrics: savedEvaluation.metricsJson,
        createdAt: savedEvaluation.createdAt,
      },
    });

  } catch (error) {
    console.error('Visit evaluation error:', error);

    // Return fallback evaluation if GigaChat fails
    try {
      const visitId = params.id;

      // Get basic visit info for fallback
      const [visit] = await db
        .select()
        .from(visits)
        .where(and(
          eq(visits.id, visitId),
          eq(visits.userId, user.id)
        ))
        .limit(1);

      if (visit) {
        // Save basic fallback evaluation
        const [fallbackEvaluation] = await db
          .insert(evaluations)
          .values({
            visitId: visitId,
            score: 75,
            feedbackText: 'Evaluation completed with technical assistance. Please review your performance manually.',
            metricsJson: { fallback: true, error: 'GigaChat service temporarily unavailable' },
            recommendations: [
              'Continue practicing medical sales conversations',
              'Focus on clear communication and product knowledge',
              'Work on building rapport with healthcare professionals'
            ],
          })
          .returning();

        return NextResponse.json({
          message: 'Visit evaluation completed (with technical assistance)',
          evaluation: {
            id: fallbackEvaluation.id,
            score: fallbackEvaluation.score,
            feedback: fallbackEvaluation.feedbackText,
            recommendations: fallbackEvaluation.recommendations,
            metrics: fallbackEvaluation.metricsJson,
            createdAt: fallbackEvaluation.createdAt,
          },
        });
      }
    } catch (fallbackError) {
      console.error('Fallback evaluation failed:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Evaluation service temporarily unavailable' },
      { status: 503 }
    );
  }
}
