import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // For admin routes, check if the user has admin role
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // Get the user's role from the token
      const userRole = token?.role as string | undefined
      
      if (userRole !== "Admin") {
        console.log("Access denied - Not an admin:", {
          userId: token.id,
          role: userRole,
          path: req.nextUrl.pathname
        })
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

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
}
