import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // const isLoginPage = req.nextUrl.pathname === "/login";
  req.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  req.headers.set("Pragma", "no-cache");
  req.headers.set("Expires", "0");
  const token = req.cookies.get("token")?.value;

  console.log("Request to", req.nextUrl.pathname);

  if (!token) {
    console.log("No token found, redirecting to login page");
    return NextResponse.redirect(new URL("/login", req.url), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  if (token) {
    console.log("Token found:", token);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|info).*)",
  ],
  runtime: "experimental-edge",
};
