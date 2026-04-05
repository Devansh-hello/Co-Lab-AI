import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // COEP/COOP headers enable SharedArrayBuffer for WebContainer.
  // Only set on chat pages where the IDE/WebContainer is used.
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/chat/")) {
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ws$|.*\\..*).*)"],
};
