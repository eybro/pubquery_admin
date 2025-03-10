/* eslint-disable */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === "/login";
  const token = req.cookies.get("token")?.value;

  console.log(req.cookies)
  console.log("Cookies received:", req.cookies.get("token"));
  console.log("Middleware triggered for:", req.nextUrl.pathname);
  if (token) {
    console.log("Token found:", token);
  }


  if (isLoginPage) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("Redirecting to login page");
    return NextResponse.redirect("https://admin.pubquery.se/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|login).*)",
};