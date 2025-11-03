import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { db } from '@/lib/db';
import { doctors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['rep', 'trainer', 'manager']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const activeDoctors = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialty: doctors.specialty,
        personalityType: doctors.personalityType,
        experienceLevel: doctors.experienceLevel,
        avatarUrl: doctors.avatarUrl,
      })
      .from(doctors)
      .where(eq(doctors.isActive, true))
      .orderBy(doctors.name);

    return NextResponse.json({ doctors: activeDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}