import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth/token';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const tokenPayload = getUserFromToken(token);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user with company info
    const [userWithCompany] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          subscriptionPlan: companies.subscriptionPlan,
        },
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!userWithCompany) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!userWithCompany.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Return user info
    return NextResponse.json({
      user: userWithCompany,
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
