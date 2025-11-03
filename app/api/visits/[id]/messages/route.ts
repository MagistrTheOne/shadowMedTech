import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { visitMessages, visits } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/visits/[id]/messages - Get messages for a visit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request, ['rep', 'trainer']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const visitId = params.id;

  try {
    // Verify visit belongs to user
    const [visit] = await db
      .select()
      .from(visits)
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Only allow access to own visits for reps
    if (user.role === 'rep' && visit.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages
    const messages = await db
      .select({
        id: visitMessages.id,
        role: visitMessages.role,
        content: visitMessages.content,
        timestamp: visitMessages.timestamp,
        metadata: visitMessages.metadata,
      })
      .from(visitMessages)
      .where(eq(visitMessages.visitId, visitId))
      .orderBy(desc(visitMessages.timestamp));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/visits/[id]/messages - Add a new message to visit
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request, ['rep', 'trainer']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const visitId = params.id;

  try {
    const { role, content, metadata } = await request.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "user" or "assistant"' },
        { status: 400 }
      );
    }

    // Verify visit exists and belongs to user (for reps)
    const [visit] = await db
      .select()
      .from(visits)
      .where(eq(visits.id, visitId))
      .limit(1);

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Only allow access to own visits for reps
    if (user.role === 'rep' && visit.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Save message
    const [newMessage] = await db
      .insert(visitMessages)
      .values({
        visitId,
        role,
        content,
        metadata,
      })
      .returning();

    if (!newMessage) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Return the saved message
    return NextResponse.json({
      message: {
        id: newMessage.id,
        role: newMessage.role,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        metadata: newMessage.metadata,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Save message error:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}
