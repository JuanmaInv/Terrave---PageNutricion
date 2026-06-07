import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";

const proxy = TEST_AUTH_MODE
  ? () => NextResponse.next()
  : clerkMiddleware();

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
