import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isApproved } from "@/lib/access";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];
const PENDING_PATHS = ["/pending", "/api/invitations/claim"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  const isPendingPath = PENDING_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (!isApproved(session)) {
    if (isPendingPath) return NextResponse.next();
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  if (pathname === "/pending") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
