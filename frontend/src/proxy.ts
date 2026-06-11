import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { AUTH_ENABLED } from "@/lib/auth";

const proxy = AUTH_ENABLED
  ? clerkMiddleware()
  : () => NextResponse.next();

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
