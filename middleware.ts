// middleware.ts — ROOT of your project (same level as package.json)
//
// Runs on every request before the page loads.
// Checks: is this user logged in?
// If not, redirects them to /login automatically.

export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login           (the sign-in page itself)
     * - /api/auth/...    (Auth.js's own API routes)
     * - /_next/...       (Next.js internal files)
     * - Static files (images, fonts, etc.)
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
