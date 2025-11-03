import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from './lib/auth/token';

// Define protected routes and their required roles
const protectedRoutes = {
  // Admin only routes
  '/api/users': ['admin'],
  '/api/admin': ['admin'],

  // Trainer routes (admin + trainer)
  '/api/doctors': ['admin', 'trainer'],
  '/api/scenarios': ['admin', 'trainer'],
  '/api/medications': ['admin', 'trainer'],
  '/api/trainer': ['admin', 'trainer'],

  // Manager routes (admin + manager)
  '/api/manager': ['admin', 'manager'],

  // Rep routes (admin + rep)
  '/api/visits': ['admin', 'rep'],
  '/api/rep': ['admin', 'rep'],

  // Auth routes (public, but some require auth)
  '/api/auth/me': [], // Requires auth, but no specific role

  // Dashboard routes
  '/dashboard': [], // Requires auth, role checked in component
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/api/auth/signup',
  '/api/auth/signin',
];

// Helper function to check if path matches protected route
function getRequiredRoles(pathname: string): string[] | null {
  // Check exact matches first
  if (protectedRoutes[pathname as keyof typeof protectedRoutes]) {
    return protectedRoutes[pathname as keyof typeof protectedRoutes];
  }

  // Check prefix matches for dynamic routes
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }

  return null;
}

// Helper function to check if path is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, Next.js internals, and API routes that handle auth themselves
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiredRoles = getRequiredRoles(pathname);
  const isPublic = isPublicRoute(pathname);

  if (requiredRoles === null && !isPublic) {
    // Unknown route, let Next.js handle it
    return NextResponse.next();
  }

  // Get token from request (Authorization header or cookie)
  let token = getTokenFromRequest(request);
  
  // If no token in header, check cookies
  if (!token) {
    const cookies = request.cookies.get('auth-token');
    token = cookies?.value || null;
  }

  if (!token) {
    // No token provided
    if (!isPublic && requiredRoles !== null) {
      // Protected route without token - redirect to signin
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
    // Public route or unknown route - allow
    return NextResponse.next();
  }

  // Verify token
  const userPayload = getUserFromToken(token);

  if (!userPayload) {
    // Invalid token
    if (!isPublic && requiredRoles !== null) {
      // Protected route with invalid token - redirect to signin
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
    // Public route - allow
    return NextResponse.next();
  }

  // Check role permissions for protected routes
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userPayload.role)) {
      // Insufficient permissions - return 403
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userPayload.userId);
  requestHeaders.set('x-user-role', userPayload.role);
  requestHeaders.set('x-user-email', userPayload.email);
  if (userPayload.companyId) {
    requestHeaders.set('x-user-company-id', userPayload.companyId);
  }

  // Continue with modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
