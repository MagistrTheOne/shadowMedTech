import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from './token';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
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

    // Get full user info from database
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Check role permissions if specified
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return { user };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export function requireRole(allowedRoles: string[]) {
  return async function (request: NextRequest) {
    return requireAuth(request, allowedRoles);
  };
}
