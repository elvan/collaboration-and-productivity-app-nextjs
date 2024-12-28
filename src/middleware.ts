import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Check admin access for admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      try {
        const response = await fetch(new URL("/api/admin/access", req.url));
        const { hasAccess } = await response.json();
        
        if (!hasAccess) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      } catch (error) {
        // If there's an error checking access, redirect to dashboard
        console.error("Error checking admin access:", error);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - register
     * - / (home page)
     */
    "/dashboard/:path*",
    "/settings/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/notifications/:path*",
    "/messages/:path*",
    "/admin/:path*", // Add admin routes to protected paths
  ],
};
