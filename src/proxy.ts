import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const STAFF_ROLES = new Set(["SUPPORT", "MANAGER", "SUPER_ADMIN"]);

export default auth((req) => {
  const role = req.auth?.user?.role;

  if (!role || !STAFF_ROLES.has(role)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
