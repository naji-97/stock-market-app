import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Public routes that don't require authentication
const publicRoutes = ['/sign-in', '/sign-up']; // Removed '/'
// Add other truly public routes like '/about', '/contact', '/pricing' if needed

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    // Check if the current route is public
    const isPublicRoute = publicRoutes.includes(pathname);

    // User is logged in BUT trying to access auth pages → redirect to home
    if (sessionCookie && isPublicRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // User is NOT logged in AND trying to access protected route → redirect to sign-in
    if (!sessionCookie && !isPublicRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    ],
};