import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth?.token as { userType?: string } | null | undefined;
    const pathname = req.nextUrl.pathname;

    // Admin routes require ADMIN user type
    if (pathname.startsWith("/admin")) {
      if (!token || token.userType !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname;

        // Public routes
        const publicPaths = ["/", "/login", "/register", "/pricing", "/verify-email", "/reset-password", "/accept-invite", "/agencies"];
        if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
          return true;
        }

        // Candidate portal routes are public for Sprint 2 (Sprint 4 will add CandidateUser auth)
        if (pathname.startsWith("/candidate") || pathname.startsWith("/api/candidate")) {
          return true;
        }

        // API auth routes, setup, and public agency profiles are public
        if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/setup") || pathname.startsWith("/api/agencies")) {
          return true;
        }

        // Everything else requires a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
