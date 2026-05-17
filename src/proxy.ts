import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const protectedPrefixes = ["/dashboard", "/grants", "/funders", "/documents", "/team", "/settings", "/organization"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/grants/:path*",
    "/funders/:path*",
    "/documents/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/organization/:path*",
  ],
};
