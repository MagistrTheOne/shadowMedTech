import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, companies } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/require-auth';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { eq, and } from 'drizzle-orm';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'trainer', 'manager', 'rep']).default('rep'),
  companyId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'trainer', 'manager', 'rep']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - List users (Admin only)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { user } = authResult;

    // Get all users with company info
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        company: {
          id: companies.id,
          name: companies.name,
        },
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .orderBy(users.createdAt);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user (Admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, ['admin']);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Validate password strength
    if (validatedData.password) {
      const passwordValidation = validatePasswordStrength(validatedData.password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          {
            error: 'Password too weak',
            details: passwordValidation.errors
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role,
        companyId: validatedData.companyId,
      })
      .returning();

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Return created user
    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);

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
